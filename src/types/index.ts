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
 * What was logged on a day, at most one entry per card per day. `weed_credit`
 * and `weed_over` retired with the weekly credit budget, but entries logged
 * under those rules are still in the log, so both stay in the union.
 */
export type ViceType = 'no_weed' | 'weed_credit' | 'weed_over' | 'no_porn' | 'drinks_3plus' | 'no_food_delivery'

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
