import type { AppState } from '../types'

const KEY = 'habit_state'

export const SCHEMA_VERSION = 1

export function emptyState(): AppState {
  return {
    habits: [],
    completedHabits: [],
    seededHabitDays: [],
    weeklyTasks: [],
    completedWeeklyTasks: [],
    viceLog: [],
    importedFromLevelUp: false,
    schemaVersion: SCHEMA_VERSION,
  }
}

/** Nothing the user would miss. Never backed up, and the only state the LevelUp import runs over. */
export function isEmptyState(state: AppState): boolean {
  return state.habits.length === 0 && state.weeklyTasks.length === 0 && state.viceLog.length === 0
}

/**
 * Activities taken off the roster. Their saved habits are dropped on load:
 * the weekly auto-seed copies the prior week forward, so one left behind would
 * reappear in every future week, and its signal would now reach a LevelUp that
 * no longer knows the id (unknown ids are skipped permanently — a silent
 * no-XP tick). `yoga` moved to ProtocolsTracker as the "Flexibility" action.
 * XP already awarded is untouched; it lives in LevelUp's own history.
 */
const RETIRED_ACTIVITY_IDS = new Set(['yoga'])

const habitIdOf = (slot: string): string => slot.slice(0, slot.lastIndexOf(':'))

/**
 * Spread `emptyState()` UNDER the parsed blob so a field added in a later
 * version can't crash on data written by an older one.
 */
export function hydrate(parsed: Partial<AppState>): AppState {
  const state = { ...emptyState(), ...parsed, schemaVersion: SCHEMA_VERSION }
  const retired = new Set(
    state.habits.filter((h) => RETIRED_ACTIVITY_IDS.has(h.activityId)).map((h) => h.id)
  )
  if (retired.size === 0) return state
  return {
    ...state,
    habits: state.habits.filter((h) => !retired.has(h.id)),
    completedHabits: state.completedHabits.filter((slot) => !retired.has(habitIdOf(slot))),
  }
}

export function loadState(): AppState | null {
  try {
    const raw = localStorage.getItem(KEY)
    return raw ? hydrate(JSON.parse(raw) as Partial<AppState>) : null
  } catch {
    return null
  }
}

export function saveState(state: AppState): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(state))
  } catch {
    // localStorage may be full; fail silently
  }
}
