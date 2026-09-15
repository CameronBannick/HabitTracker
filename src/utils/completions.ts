import type { AppState } from '../types'
import type { SignalInput } from './cloudSignal'
import { TASK_ACTIVITY_ID, VICE_DEFS } from './roster'

/** "id:YYYY-MM-DD" → [id, date]. Ids may themselves contain colons; dates never do. */
function splitSlot(slot: string): [string, string] {
  const i = slot.lastIndexOf(':')
  return [slot.slice(0, i), slot.slice(i + 1)]
}

/**
 * Every completion in state, as a LevelUp signal — the 1-for-1 mapping.
 *
 * Derived, not hooked (docs/SATELLITE-INTEGRATION.md): walked on every state
 * change so a completion made offline still reaches the bus later. Occurrence
 * keys are stable across reloads and unique per completion, which is what makes
 * re-deriving safe.
 *
 *   habit  habit:<habitId>:<date>   the habit's own activity
 *   task   task:<taskId>            weekly_task, named via label
 *   vice   vice:<entryId>           the vice's template; a credit day sends nothing
 */
export function completionSignals(state: AppState): SignalInput[] {
  const habitsById = new Map(state.habits.map((h) => [h.id, h]))
  const tasksById = new Map(state.weeklyTasks.map((t) => [t.id, t]))

  const habits = state.completedHabits.flatMap((slot): SignalInput[] => {
    const [id, dateISO] = splitSlot(slot)
    const habit = habitsById.get(id)
    if (!habit) return []
    return [{ activityId: habit.activityId, dateISO, occurrenceKey: `habit:${id}:${dateISO}` }]
  })

  const tasks = state.completedWeeklyTasks.flatMap((slot): SignalInput[] => {
    const [id, dateISO] = splitSlot(slot)
    const task = tasksById.get(id)
    if (!task) return []
    return [{ activityId: TASK_ACTIVITY_ID, dateISO, occurrenceKey: `task:${id}`, label: task.name }]
  })

  const vices = state.viceLog.flatMap((entry): SignalInput[] => {
    const activityId = VICE_DEFS[entry.type]?.activityId
    if (!activityId) return []
    return [{ activityId, dateISO: entry.dateISO, occurrenceKey: `vice:${entry.id}` }]
  })

  return [...habits, ...tasks, ...vices]
}
