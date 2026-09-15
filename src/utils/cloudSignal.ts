// Cross-app signal emitter — how HabitTracker reports into LevelUp.
//
// HabitTracker owns LevelUp's Habits, Tasks and Vices outright (utils/roster.ts).
// Every habit ticked, task finished and vice logged here POSTs one signal to a
// shared Supabase table that LevelUp polls; LevelUp awards the XP from its own
// templates.
//
// 1-FOR-1, PER OCCURRENCE (v2), like WeeklyPlanner. `occurrence_key` is what
// dedups — LevelUp derives the id of the row it creates from that key, which
// makes replays after a cloud restore no-ops. Tasks also send `label` (v3): a
// task's name is free text, and every task shares the one `weekly_task`
// template.
//
// ORDERING HAZARD: LevelUp advances its cursor past signals whose activity_id
// it doesn't know, so an out-of-date LevelUp loses them for good. Every id this
// app sends must exist in LevelUp's activityTemplates.ts in the build that is
// installed on the phone.
//
// Shared bus: the `signals` table in the levelup-backup Supabase project.
// The publishable key is safe-by-design to embed (single-user personal apps).
// See LevelUp's docs/SATELLITE-INTEGRATION.md for the full protocol.
//
// One-way: nothing logged here can be taken back in LevelUp.

import { LEVELUP_ACTIVITY_IDS } from './roster'

const SUPABASE_URL = 'https://njknlqvbmejagbsnikqe.supabase.co'
const SUPABASE_KEY = 'sb_publishable_nNfKefHnghphPSO80wD-8Q_BT5TxgnQ'

const SOURCE = 'habit-tracker'
/** Which LevelUp consumes these rows. Set VITE_SIGNAL_TARGET=levelup-dev when
 *  testing, so the phone's LevelUp never picks up test completions. */
export const SIGNAL_TARGET: string = import.meta.env.VITE_SIGNAL_TARGET || 'levelup'
/** Occurrence keys already on the bus. Grows by one per completion. */
const SIGNALED_KEY = 'habit_signaled_events'

/** Master switch for the cross-app signal seam. */
export const ENABLE_CLOUD_SIGNAL = true

export interface SignalInput {
  /** A LevelUp ACTIVITY_TEMPLATES id — must be one of LEVELUP_ACTIVITY_IDS. */
  activityId: string
  /** "YYYY-MM-DD", the LOCAL calendar date the completion belongs to. */
  dateISO: string
  /** Stable, unique per completion event. */
  occurrenceKey: string
  /** Display name LevelUp should use instead of the template's (tasks). */
  label?: string
}

// Synchronously reserved keys whose POST is in flight — closes the race where
// an effect fires twice (e.g. React StrictMode) before the first POST records
// its key, which would otherwise emit two rows for the same completion.
const inFlight = new Set<string>()

function signaledKeys(): Set<string> {
  try {
    return new Set(JSON.parse(localStorage.getItem(SIGNALED_KEY) ?? '[]') as string[])
  } catch {
    return new Set()
  }
}

function writeKeys(keys: Set<string>): boolean {
  try {
    localStorage.setItem(SIGNALED_KEY, JSON.stringify([...keys]))
    return true
  } catch {
    return false // localStorage full; LevelUp still discards a re-sent key
  }
}

/** Namespaced so LevelUp can key a row on it without colliding with another app. */
function qualify(occurrenceKey: string): string {
  return `${SOURCE}:${occurrenceKey}`
}

/**
 * Record completions as already on the bus WITHOUT posting them.
 *
 * Used by the LevelUp import: those completions were scored in LevelUp under
 * LevelUp's own ids, so if they were re-sent under ours LevelUp could not tell
 * and would award them twice. Returns false if the ledger couldn't be written,
 * in which case the caller must not import.
 */
export function markAlreadySignaled(occurrenceKeys: string[]): boolean {
  if (occurrenceKeys.length === 0) return true
  const keys = signaledKeys()
  for (const key of occurrenceKeys) keys.add(qualify(key))
  return writeKeys(keys)
}

type PostResult = 'ok' | 'schema' | 'failed'

async function post(body: Record<string, unknown>): Promise<PostResult> {
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/signals`, {
      method: 'POST',
      headers: {
        apikey: SUPABASE_KEY,
        Authorization: `Bearer ${SUPABASE_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    })
    if (res.ok) return 'ok'
    // 400 = PostgREST rejecting a column it doesn't know.
    return res.status === 400 ? 'schema' : 'failed'
  } catch {
    return 'failed' // offline or unreachable
  }
}

async function sendSignal(input: SignalInput): Promise<boolean> {
  const body = {
    source: SOURCE,
    target_app: SIGNAL_TARGET,
    activity_id: input.activityId,
    date_iso: input.dateISO,
    occurrence_key: qualify(input.occurrenceKey),
  }
  const result = await post(input.label ? { ...body, label: input.label } : body)
  if (result === 'ok') return true
  // The v3 `label` column isn't on the project: the completion still scores
  // without it, LevelUp just shows the template name ("Weekly Task").
  if (result === 'schema' && input.label) return (await post(body)) === 'ok'
  return false
}

/**
 * Emit every completion not already on the bus, at most once per key. A key is
 * recorded only after a successful POST, so an offline attempt retries on the
 * next state change.
 */
export function signalCompletions(inputs: SignalInput[]): void {
  if (!ENABLE_CLOUD_SIGNAL || inputs.length === 0) return
  const sent = signaledKeys()
  for (const input of inputs) {
    if (!LEVELUP_ACTIVITY_IDS.includes(input.activityId)) continue // LevelUp would drop it for good
    const key = qualify(input.occurrenceKey)
    if (sent.has(key) || inFlight.has(key)) continue
    inFlight.add(key) // reserve synchronously, before the await
    void sendSignal(input)
      .then((ok) => {
        if (!ok) return
        const keys = signaledKeys()
        keys.add(key)
        writeKeys(keys)
      })
      .finally(() => inFlight.delete(key))
  }
}
