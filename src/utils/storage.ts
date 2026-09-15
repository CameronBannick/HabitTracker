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
 * Spread `emptyState()` UNDER the parsed blob so a field added in a later
 * version can't crash on data written by an older one.
 */
export function hydrate(parsed: Partial<AppState>): AppState {
  return { ...emptyState(), ...parsed, schemaVersion: SCHEMA_VERSION }
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
