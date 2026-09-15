export interface Habit {
  id: string
  /** LevelUp ACTIVITY_TEMPLATES id — what goes on the wire. */
  activityId: string
  name: string
  categoryId: string
  /** Mirrors LevelUp's basePoints, for display. LevelUp scores from its own template. */
  xpReward: number
  /** Local calendar date the habit belongs to — habits only show on this day. */
  dateISO: string
}

export interface WeeklyTask {
  id: string
  name: string
  description?: string
  /** Display only — every task scores LevelUp's `weekly_task` template. */
  xpReward: number
  /** ISO week string, e.g. "2026-W38". Tasks only show during this week. */
  weekISO: string
}

/**
 * What was logged on a day. The weed card writes exactly one of the first
 * three per day; `weed_credit` vs `weed_over` is decided once, when the entry
 * is logged, and stored — so a signal can never change meaning afterwards.
 */
export type ViceType = 'no_weed' | 'weed_credit' | 'weed_over' | 'no_porn' | 'drinks_3plus'

export interface ViceEntry {
  id: string
  type: ViceType
  dateISO: string
  /** Display only — LevelUp scores from its own vice template. */
  xpImpact: number
}

export interface AppState {
  habits: Habit[]
  completedHabits: string[]       // "habitId:YYYY-MM-DD"
  seededHabitDays: string[]       // dateISO strings already auto-seeded from the prior week
  weeklyTasks: WeeklyTask[]
  completedWeeklyTasks: string[]  // "taskId:YYYY-MM-DD"
  viceLog: ViceEntry[]
  /** The one-time hand-over from LevelUp's cloud backup has run. */
  importedFromLevelUp: boolean
  schemaVersion: number
}
