// One-time hand-over from LevelUp.
//
// Before this app existed, habits, tasks and vices lived in LevelUp. On first
// launch we read LevelUp's newest cloud backup (read-only — the `backups`
// table) and carry over what is still live, so nothing has to be re-entered:
//
//   habits        dated from last Monday on — this week is live, and last
//                 week is what the weekly auto-seed copies forward from
//   tasks         this week's
//   vices         this week's No Weed / No Porn, so today's can't be claimed
//                 twice. Legacy No Alcohol / Hangover have no equivalent, and
//                 weed credits start full: LevelUp never logged weed days.
//
// Everything already completed in here was scored by LevelUp. The caller must
// mark those completions as sent (markAlreadySignaled) BEFORE they reach state.

import type { AppState, Habit, ViceEntry, WeeklyTask } from '../types'
import { addDays, fromLocalISODate, getMondayOf, toLocalISODate, weekISOOf } from './date'
import { HABIT_ROSTER, TASK_XP, VICE_DEFS, WEED_TYPES } from './roster'

const SUPABASE_URL = 'https://njknlqvbmejagbsnikqe.supabase.co'
const SUPABASE_KEY = 'sb_publishable_nNfKefHnghphPSO80wD-8Q_BT5TxgnQ'

/** The slice of LevelUp's AppState we read. Another app's data: every field may be missing. */
interface LevelUpState {
  dailyHabits?: { id: string; name: string; dateISO?: string }[]
  completedHabits?: string[]
  seededHabitDays?: string[]
  weeklyTasks?: { id: string; name: string; description?: string; weekISO: string }[]
  completedWeeklyTasks?: string[]
  viceLog?: { id: string; type: string; dateISO: string }[]
}

export type ImportedSlice = Pick<
  AppState,
  'habits' | 'completedHabits' | 'seededHabitDays' | 'weeklyTasks' | 'completedWeeklyTasks' | 'viceLog'
>

/** LevelUp's newest backup, or null if there is none or the project is unreachable. */
export async function fetchLevelUpBackup(): Promise<LevelUpState | null> {
  try {
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/backups?select=state&order=created_at.desc&limit=1`,
      { headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` } }
    )
    if (!res.ok) return null
    const rows = (await res.json()) as { state: LevelUpState | null }[]
    return rows[0]?.state ?? null
  } catch {
    return null
  }
}

const idOf = (slot: string): string => slot.slice(0, slot.lastIndexOf(':'))

/**
 * Old LevelUp template names → roster id. LevelUp's weekly seeding copies a
 * habit's name forward, so habits created before a template was renamed still
 * carry the old name today.
 */
const LEGACY_HABIT_NAMES: Record<string, string> = {
  Journaling: 'journaling', // now "CBT Journal App"
}

export function mapLevelUpState(lu: LevelUpState, todayISO: string): ImportedSlice {
  const today = fromLocalISODate(todayISO)
  const since = toLocalISODate(addDays(getMondayOf(today), -7))
  const thisWeek = weekISOOf(today)

  const habits = (lu.dailyHabits ?? []).flatMap((h): Habit[] => {
    if (!h.dateISO || h.dateISO < since) return []
    // Matched by name — all a LevelUp habit keeps of its template. A name not on
    // the roster belongs to another satellite (Complete Daily Protocols, Study
    // Math); importing it would award that XP twice.
    const activity = HABIT_ROSTER.find((a) => a.name === h.name || a.activityId === LEGACY_HABIT_NAMES[h.name])
    if (!activity) return []
    return [{
      id: h.id,
      activityId: activity.activityId,
      name: activity.name,
      categoryId: activity.categoryId,
      xpReward: activity.basePoints,
      dateISO: h.dateISO,
    }]
  })
  const habitIds = new Set(habits.map((h) => h.id))

  const weeklyTasks = (lu.weeklyTasks ?? [])
    .filter((t) => t.weekISO === thisWeek)
    .map((t): WeeklyTask => ({ id: t.id, name: t.name, description: t.description, xpReward: TASK_XP, weekISO: t.weekISO }))
  const taskIds = new Set(weeklyTasks.map((t) => t.id))

  const viceLog = (lu.viceLog ?? []).flatMap((e): ViceEntry[] => {
    if (e.type !== 'no_weed' && e.type !== 'no_porn') return []
    if (weekISOOf(fromLocalISODate(e.dateISO)) !== thisWeek) return []
    return [{ id: e.id, type: e.type, dateISO: e.dateISO, xpImpact: VICE_DEFS[e.type].xp }]
  })

  return {
    habits,
    completedHabits: (lu.completedHabits ?? []).filter((slot) => habitIds.has(idOf(slot))),
    seededHabitDays: (lu.seededHabitDays ?? []).filter((d) => d >= since),
    weeklyTasks,
    completedWeeklyTasks: (lu.completedWeeklyTasks ?? []).filter((slot) => taskIds.has(idOf(slot))),
    viceLog,
  }
}

/** Fold an import into existing state without duplicating anything already here. */
export function mergeImport(state: AppState, slice: ImportedSlice): AppState {
  const byId = <T extends { id: string }>(mine: T[], theirs: T[]): T[] => {
    const have = new Set(mine.map((x) => x.id))
    return [...mine, ...theirs.filter((x) => !have.has(x.id))]
  }
  const union = (a: string[], b: string[]): string[] => [...new Set([...a, ...b])]

  // One weed entry per day, one No Porn per day: skip an imported vice whose
  // slot for that day is already taken here.
  const vices = slice.viceLog.filter((v) => {
    const group = WEED_TYPES.includes(v.type) ? WEED_TYPES : [v.type]
    return !state.viceLog.some((e) => e.id === v.id || (e.dateISO === v.dateISO && group.includes(e.type)))
  })

  return {
    ...state,
    habits: byId(state.habits, slice.habits),
    completedHabits: union(state.completedHabits, slice.completedHabits),
    seededHabitDays: union(state.seededHabitDays, slice.seededHabitDays),
    weeklyTasks: byId(state.weeklyTasks, slice.weeklyTasks),
    completedWeeklyTasks: union(state.completedWeeklyTasks, slice.completedWeeklyTasks),
    viceLog: [...state.viceLog, ...vices],
    importedFromLevelUp: true,
  }
}
