import type { HabitApp } from '../hooks/useHabitState'
import { SystemCard } from '../components/SystemCard'
import { VICE_DEFS, WEED_TYPES } from '../utils/roster'
import { currentWeekISO, fromLocalISODate, todayISO, weekISOOf } from '../utils/date'

const SL_BLUE  = '#1E7FFF'
const SL_DIM   = 'rgba(30,127,255,0.12)'
const SL_LABEL = '#3A7FCC'
const GREEN    = '#10B981'
const RED      = '#EF4444'
const HEALTH   = '#06B6D4'

function xpText(xp: number): string {
  return xp > 0 ? `+${xp}` : xp < 0 ? `−${Math.abs(xp)}` : '0'
}

function xpColor(xp: number): string {
  return xp > 0 ? GREEN : xp < 0 ? RED : SL_LABEL
}

interface ViceButtonProps {
  label: string
  color: string
  disabled: boolean
  onClick: () => void
}

function ViceButton({ label, color, disabled, onClick }: ViceButtonProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="w-full py-1.5 text-xs font-bold transition-opacity disabled:opacity-50"
      style={{
        background: disabled ? 'rgba(30,127,255,0.2)' : color,
        color: 'white',
        border: `1px solid ${disabled ? SL_LABEL : color}`,
      }}
    >
      {label}
    </button>
  )
}

const SIMPLE_VICES: { type: 'no_porn' | 'no_food_delivery' | 'drinks_3plus'; emoji: string }[] = [
  { type: 'no_porn',          emoji: '🚫' },
  { type: 'no_food_delivery', emoji: '🥡' },
  { type: 'drinks_3plus',     emoji: '🍺' },
]

export function Vices({ app }: { app: HabitApp }) {
  const { state, logVice } = app
  const today = todayISO()
  const thisWeek = currentWeekISO()

  const weekEntries = state.viceLog.filter((e) => weekISOOf(fromLocalISODate(e.dateISO)) === thisWeek)
  const weekXP = weekEntries.reduce((sum, e) => sum + e.xpImpact, 0)

  const weedToday = state.viceLog.find((e) => e.dateISO === today && WEED_TYPES.includes(e.type))

  // Newest first; reversing before the stable sort keeps same-day entries newest-first too.
  const recentEntries = [...state.viceLog]
    .reverse()
    .sort((a, b) => b.dateISO.localeCompare(a.dateISO))
    .slice(0, 10)

  return (
    <div>

      {/* ── Header ── */}
      <div
        className="px-4 pb-3 sticky top-0 z-30"
        style={{ background: 'rgba(4,8,16,0.98)', paddingTop: 'calc(1.25rem + var(--sat))' }}
      >
        <div className="flex items-center gap-2 mb-3">
          <div className="w-1 h-1 rotate-45" style={{ background: SL_BLUE }} />
          <span className="text-[9px] uppercase tracking-[0.35em] font-semibold" style={{ color: SL_BLUE }}>
            Vices Tracker
          </span>
          <div className="flex-1 border-b" style={{ borderColor: SL_DIM }} />
          <span className="text-[9px]" style={{ color: SL_LABEL }}>
            {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
          </span>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-xs" style={{ color: '#A8CCFF' }}>Health XP from vices this week</span>
          <span className="text-sm font-mono font-bold" style={{ color: weekXP < 0 ? RED : HEALTH }}>
            {xpText(weekXP)}
          </span>
        </div>
      </div>

      {/* ── Content ── */}
      <div className="px-4 pb-4">
        <div className="flex flex-col gap-3">

          {/* Weed — a clean day, or nothing to log */}
          <SystemCard>
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-bold text-white">🌿 Weed</p>
              <span className="text-xs font-bold" style={{ color: xpColor(VICE_DEFS.no_weed.xp) }}>
                {xpText(VICE_DEFS.no_weed.xp)} XP
              </span>
            </div>
            <p className="text-xs text-right mb-2" style={{ color: SL_LABEL }}>
              {weedToday ? `✓ ${VICE_DEFS[weedToday.type].label}` : 'Not logged today'}
            </p>
            <ViceButton
              label={weedToday ? 'Already Logged' : `Clean Day ${xpText(VICE_DEFS.no_weed.xp)} XP`}
              color={GREEN}
              disabled={!!weedToday}
              onClick={() => logVice('weed_clean')}
            />
          </SystemCard>

          {/* No Porn, No Food Delivery, 3+ Drinks — once a day each */}
          {SIMPLE_VICES.map(({ type, emoji }) => {
            const def = VICE_DEFS[type]
            const loggedToday = state.viceLog.some((e) => e.type === type && e.dateISO === today)
            return (
              <SystemCard key={type}>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-bold text-white">{emoji} {def.label}</p>
                  <span className="text-xs font-bold" style={{ color: xpColor(def.xp) }}>
                    {xpText(def.xp)} XP
                  </span>
                </div>
                <p className="text-xs text-right mb-2" style={{ color: SL_LABEL }}>
                  {loggedToday ? '✓ Logged today' : 'Not logged today'}
                </p>
                <ViceButton
                  label={loggedToday ? 'Already Logged' : `Log ${def.label}`}
                  color={SL_BLUE}
                  disabled={loggedToday}
                  onClick={() => logVice(type)}
                />
              </SystemCard>
            )
          })}

          {/* Recent Log */}
          {recentEntries.length > 0 && (
            <div className="mt-4 pt-4" style={{ borderTop: `1px solid ${SL_DIM}` }}>
              <p className="text-[9px] uppercase tracking-[0.2em] mb-2" style={{ color: SL_LABEL }}>
                Recent Log
              </p>
              <div className="space-y-1">
                {recentEntries.map((entry) => (
                  <div key={entry.id} className="text-xs" style={{ color: '#A8CCFF' }}>
                    {entry.dateISO}{' '}
                    <span style={{ color: xpColor(entry.xpImpact) }}>
                      · {VICE_DEFS[entry.type]?.label ?? entry.type} · {xpText(entry.xpImpact)} XP
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
