import { useState } from 'react'
import { Check, ClipboardCopy, Cloud, Download, Link2, X } from 'lucide-react'
import type { AppState } from '../types'
import type { HabitApp, ImportResult } from '../hooks/useHabitState'
import { SystemCard } from '../components/SystemCard'
import { ENABLE_CLOUD_SIGNAL, SIGNAL_TARGET } from '../utils/cloudSignal'
import { TASK_XP, VICE_DEFS } from '../utils/roster'

const SL_BLUE  = '#1E7FFF'
const SL_DIM   = 'rgba(30,127,255,0.12)'
const SL_LABEL = '#3A7FCC'
const SL_AMBER = '#F5A623'

function SectionTitle({ title, right }: { title: string; right?: string }) {
  return (
    <div className="flex items-center gap-2 mb-2">
      <div className="w-1 h-1 rotate-45" style={{ background: SL_BLUE }} />
      <span className="text-[9px] uppercase tracking-[0.35em] font-semibold" style={{ color: SL_BLUE }}>
        {title}
      </span>
      <div className="flex-1 border-b" style={{ borderColor: SL_DIM }} />
      {right && <span className="text-[9px] font-mono" style={{ color: SL_LABEL }}>{right}</span>}
    </div>
  )
}

function describeImport(result: ImportResult): string {
  switch (result.status) {
    case 'ok':
      return `Imported ${result.habits} habits, ${result.tasks} tasks and ${result.vices} vice logs.`
    case 'unreachable':
      return "Couldn't reach LevelUp's cloud backup. Try again when you're online."
    case 'ledger-failed':
      return "Couldn't write the signal ledger (storage full?), so nothing was imported."
  }
}

const XP_ROWS: { label: string; xp: string }[] = [
  { label: 'Habit', xp: "its LevelUp value, to its attribute" },
  { label: 'Weekly task', xp: `+${TASK_XP} Responsibilities` },
  { label: 'Clean weed day', xp: `+${VICE_DEFS.no_weed.xp} Health` },
  { label: 'No Porn', xp: `+${VICE_DEFS.no_porn.xp} Health` },
  { label: '3+ Drinks', xp: `${VICE_DEFS.drinks_3plus.xp} Health` },
]

export function Settings({ app }: { app: HabitApp }) {
  const { state, lastBackupAt, backupNow, restoreFromCloud, importFromLevelUp, importState } = app
  const [importMsg, setImportMsg] = useState('')
  const [importing, setImporting] = useState(false)
  const [backupMsg, setBackupMsg] = useState('')
  const [copied, setCopied] = useState(false)
  const [sheetOpen, setSheetOpen] = useState(false)
  const [sheetText, setSheetText] = useState('')
  const [sheetError, setSheetError] = useState('')

  async function runLevelUpImport() {
    setImporting(true)
    setImportMsg(describeImport(await importFromLevelUp()))
    setImporting(false)
  }

  async function runBackup() {
    setBackupMsg('Backing up…')
    setBackupMsg((await backupNow()) ? 'Backed up ✓' : 'Nothing backed up (empty, or offline)')
  }

  async function runRestore() {
    if (!(await restoreFromCloud())) setBackupMsg('No backup restored')
  }

  async function copyState() {
    try {
      await navigator.clipboard.writeText(JSON.stringify(state))
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      setCopied(false)
    }
  }

  function runJsonImport() {
    try {
      const parsed = JSON.parse(sheetText) as AppState
      if (!Array.isArray(parsed.habits) || !Array.isArray(parsed.viceLog)) throw new Error('not an export')
      importState(parsed)
      setSheetOpen(false)
      setSheetText('')
      setSheetError('')
    } catch {
      setSheetError('That is not a valid HabitTracker export.')
    }
  }

  const testTarget = SIGNAL_TARGET !== 'levelup'

  return (
    <div className="px-4 pb-4 space-y-5" style={{ paddingTop: 'calc(1.25rem + var(--sat))' }}>

      {/* ── LevelUp link ── */}
      <div>
        <SectionTitle title="LevelUp Link" right={ENABLE_CLOUD_SIGNAL ? 'ONLINE' : 'OFF'} />
        <SystemCard>
          <div className="flex items-center gap-2 mb-2">
            <Link2 size={13} style={{ color: ENABLE_CLOUD_SIGNAL && !testTarget ? SL_BLUE : SL_AMBER }} />
            <span className="text-[11px] font-mono" style={{ color: testTarget ? SL_AMBER : '#A8CCFF' }}>
              {!ENABLE_CLOUD_SIGNAL
                ? 'Signals disabled in this build'
                : testTarget
                  ? `Test build — signals go to "${SIGNAL_TARGET}"`
                  : 'Signals are being sent'}
            </span>
          </div>
          <p className="text-[10px] font-mono leading-relaxed mb-3" style={{ color: SL_LABEL }}>
            This app owns LevelUp's Habits, Tasks and Vices. Everything you check off here lands in
            LevelUp with its XP. Logged items can't be taken back there.
          </p>
          <div className="space-y-1">
            {XP_ROWS.map((row) => (
              <div key={row.label} className="flex items-center justify-between gap-3 text-[10px] font-mono">
                <span style={{ color: '#A8CCFF' }}>{row.label}</span>
                <span className="text-right" style={{ color: SL_LABEL }}>{row.xp}</span>
              </div>
            ))}
          </div>
        </SystemCard>
      </div>

      {/* ── Import from LevelUp ── */}
      <div>
        <SectionTitle title="Import from LevelUp" right={state.importedFromLevelUp ? 'DONE' : undefined} />
        <SystemCard>
          <p className="text-[10px] font-mono leading-relaxed mb-2" style={{ color: SL_LABEL }}>
            Copies this and last week's habits, this week's tasks and vice logs from LevelUp's latest
            cloud backup. Things already completed there are not sent back, so no XP is counted twice.
          </p>
          {state.importedFromLevelUp ? (
            <p className="text-[11px] font-mono" style={{ color: '#A8CCFF' }}>
              <Check size={11} className="inline mr-1 -mt-0.5" style={{ color: SL_BLUE }} />
              Imported
            </p>
          ) : (
            <button
              onClick={() => void runLevelUpImport()}
              disabled={importing}
              className="w-full flex items-center justify-center gap-2 py-2.5 text-[11px] font-mono uppercase tracking-wider disabled:opacity-50"
              style={{ border: `1px solid ${SL_BLUE}`, color: SL_BLUE, background: `${SL_BLUE}11` }}
            >
              <Download size={13} />
              {importing ? 'Importing…' : 'Import from LevelUp'}
            </button>
          )}
          {importMsg && (
            <p className="text-[10px] font-mono mt-2" style={{ color: '#A8CCFF' }}>{importMsg}</p>
          )}
        </SystemCard>
      </div>

      {/* ── Cloud backup ── */}
      <div>
        <SectionTitle
          title="Cloud Backup"
          right={lastBackupAt ? `Last ${new Date(lastBackupAt).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}` : undefined}
        />
        <SystemCard>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => void runBackup()}
              className="flex items-center justify-center gap-1.5 py-2.5 text-[10px] font-mono uppercase tracking-wider"
              style={{ border: `1px solid ${SL_DIM}`, color: SL_LABEL }}
            >
              <Cloud size={12} />
              Back Up Now
            </button>
            <button
              onClick={() => void runRestore()}
              className="flex items-center justify-center gap-1.5 py-2.5 text-[10px] font-mono uppercase tracking-wider"
              style={{ border: `1px solid ${SL_DIM}`, color: SL_LABEL }}
            >
              <Download size={12} />
              Restore
            </button>
          </div>
          <p className="text-[9px] font-mono leading-relaxed mt-2" style={{ color: '#2E5A8F' }}>
            {backupMsg || 'Backs up automatically a few seconds after every change.'}
          </p>
        </SystemCard>
      </div>

      {/* ── Data ── */}
      <div>
        <SectionTitle title="Data" />
        <SystemCard>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => void copyState()}
              className="flex items-center justify-center gap-1.5 py-2.5 text-[10px] font-mono uppercase tracking-wider"
              style={{ border: `1px solid ${SL_DIM}`, color: copied ? SL_BLUE : SL_LABEL }}
            >
              {copied ? <Check size={12} /> : <ClipboardCopy size={12} />}
              {copied ? 'Copied' : 'Export'}
            </button>
            <button
              onClick={() => setSheetOpen(true)}
              className="flex items-center justify-center gap-1.5 py-2.5 text-[10px] font-mono uppercase tracking-wider"
              style={{ border: `1px solid ${SL_DIM}`, color: SL_LABEL }}
            >
              <Download size={12} />
              Import
            </button>
          </div>
          <p className="text-[9px] font-mono leading-relaxed mt-2" style={{ color: '#2E5A8F' }}>
            Export copies the full state to the clipboard. Import replaces everything on this device.
          </p>
        </SystemCard>
      </div>

      {sheetOpen && (
        <div className="fixed inset-0 z-50 flex items-end" onClick={() => setSheetOpen(false)}>
          <div
            className="w-full animate-slide-up"
            style={{ background: 'rgba(3,10,24,0.99)', borderTop: `2px solid ${SL_BLUE}`, paddingBottom: 'var(--sab)' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-4 pt-4 pb-3" style={{ borderBottom: `1px solid ${SL_DIM}` }}>
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rotate-45" style={{ background: SL_BLUE }} />
                <span className="text-[10px] uppercase tracking-[0.35em] font-semibold" style={{ color: SL_BLUE }}>
                  Import State
                </span>
              </div>
              <button onClick={() => setSheetOpen(false)} aria-label="Close">
                <X size={18} style={{ color: SL_LABEL }} />
              </button>
            </div>
            <div className="px-4 py-4 space-y-3">
              <textarea
                value={sheetText}
                onChange={(e) => setSheetText(e.target.value)}
                rows={6}
                placeholder="Paste an exported state blob…"
                className="w-full px-3 py-2.5 text-[11px] font-mono text-white focus:outline-none placeholder:text-[#2E5A8F]"
                style={{ background: 'rgba(30,127,255,0.06)', border: `1px solid ${SL_DIM}` }}
              />
              {sheetError && (
                <p className="text-[10px] font-mono" style={{ color: SL_AMBER }}>{sheetError}</p>
              )}
              <button
                onClick={runJsonImport}
                disabled={!sheetText.trim()}
                className="w-full py-3 font-bold text-white text-sm disabled:opacity-40"
                style={{ background: SL_BLUE, boxShadow: '0 0 16px rgba(30,127,255,0.4)' }}
              >
                Replace all data
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
