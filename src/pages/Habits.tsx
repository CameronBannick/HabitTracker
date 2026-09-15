import { useEffect, useState, type FormEvent } from 'react'
import { Plus, Check, Circle, Trash2, X } from 'lucide-react'
import type { Habit } from '../types'
import type { HabitApp } from '../hooks/useHabitState'
import { CategoryIcon } from '../components/CategoryIcon'
import { ActivityPicker } from '../components/ActivityPicker'
import { WeekDatePicker } from '../components/WeekDatePicker'
import { XPBar } from '../components/XPBar'
import { categoryInfo, rosterActivity } from '../utils/roster'
import { toLocalISODate as toISO, weekDatesFromOffset, DAY_LABELS } from '../utils/date'

const SL_BLUE  = '#1E7FFF'
const SL_DIM   = 'rgba(30,127,255,0.12)'
const SL_LABEL = '#3A7FCC'

// ── Add Habit Modal ────────────────────────────────────────
interface AddHabitFormProps {
  selectedISO: string
  selectedDayLabel: string
  onAdd: (habit: Habit) => void
  onClose: () => void
}

function AddHabitForm({ selectedISO, selectedDayLabel, onAdd, onClose }: AddHabitFormProps) {
  const [selectedActivityId, setSelectedActivityId] = useState('')
  const activity = rosterActivity(selectedActivityId)
  const cat = activity ? categoryInfo(activity.categoryId) : undefined

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!activity) return
    onAdd({
      id: crypto.randomUUID(),
      activityId: activity.activityId,
      name: activity.name,
      categoryId: activity.categoryId,
      xpReward: activity.basePoints,
      dateISO: selectedISO,
    })
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end" onClick={onClose}>
      <div
        className="w-full max-h-[85vh] overflow-y-auto"
        style={{ background: 'rgba(3,10,24,0.99)', borderTop: `2px solid ${SL_BLUE}`, boxShadow: `0 -8px 40px rgba(30,127,255,0.25)`, paddingBottom: 'var(--sab)' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 pt-4 pb-3" style={{ borderBottom: `1px solid ${SL_DIM}` }}>
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rotate-45" style={{ background: SL_BLUE }} />
            <span className="text-[10px] uppercase tracking-[0.35em] font-semibold" style={{ color: SL_BLUE }}>
              Add Habit
            </span>
          </div>
          <button onClick={onClose} aria-label="Close"><X size={18} style={{ color: SL_LABEL }} /></button>
        </div>

        <form onSubmit={handleSubmit} className="px-4 py-4 flex flex-col gap-4">
          <p className="text-[10px]" style={{ color: SL_LABEL }}>
            Adding to <span style={{ color: '#A8CCFF', fontWeight: 'bold' }}>{selectedDayLabel}</span>
          </p>

          <div>
            <ActivityPicker selectedActivityId={selectedActivityId} onSelectActivityId={setSelectedActivityId} />

            {activity && (
              <p className="text-[10px] mt-1.5" style={{ color: SL_LABEL }}>
                This habit awards <span style={{ color: cat?.color ?? SL_BLUE, fontWeight: 'bold' }}>{activity.basePoints} points</span> in LevelUp
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={!activity}
            className="w-full py-3.5 font-bold text-white text-sm mt-1 disabled:opacity-50"
            style={{ background: SL_BLUE, boxShadow: `0 0 16px rgba(30,127,255,0.4)` }}
          >
            <Plus size={16} className="inline mr-2" />
            Add Habit
          </button>
        </form>
      </div>
    </div>
  )
}

// ── Main page ──────────────────────────────────────────────
export function Habits({ app }: { app: HabitApp }) {
  const { state, addHabit, removeHabit, completeHabit, seedHabitsForWeek } = app
  const [weekOffset, setWeekOffset] = useState(0)
  const [selectedDow, setSelectedDow] = useState<number>(() => {
    const day = new Date().getDay()
    return day === 0 ? 6 : day - 1   // 0=Mon in our system
  })
  const [showAddForm, setShowAddForm] = useState(false)
  const [activeHabit, setActiveHabit] = useState<string | null>(null)

  const weekDates = weekDatesFromOffset(weekOffset)
  const selectedDate = weekDates[selectedDow]
  const selectedISO  = toISO(selectedDate)
  const isPastWeek   = weekOffset < 0   // past weeks are read-only; missed habits grey out

  // Pre-fill today/future empty days of the visible week from the prior week
  // as a starting point (idempotent, one-shot per day). Re-runs once the
  // LevelUp import lands, since that's what brings last week's habits in.
  useEffect(() => {
    seedHabitsForWeek(weekDatesFromOffset(weekOffset).map(toISO))
  }, [weekOffset, seedHabitsForWeek, state.importedFromLevelUp])

  const habits = state.habits.filter((h) => h.dateISO === selectedISO)
  const completedCount = habits.filter((h) => state.completedHabits.includes(`${h.id}:${selectedISO}`)).length
  const progressRatio = habits.length > 0 ? completedCount / habits.length : 0

  function isCompleted(habit: Habit): boolean {
    return state.completedHabits.includes(`${habit.id}:${selectedISO}`)
  }

  function handleComplete(habit: Habit) {
    completeHabit(habit, selectedISO)
    setActiveHabit(null)
  }

  function handleDelete(id: string) {
    removeHabit(id)
    setActiveHabit(null)
  }

  return (
    <div>

      <WeekDatePicker
        label="Daily Habits"
        weekDates={weekDates}
        selectedDow={selectedDow}
        onSelectDow={setSelectedDow}
        onPrevWeek={() => setWeekOffset((w) => w - 1)}
        onNextWeek={() => setWeekOffset((w) => w + 1)}
      />

      {/* ── Completion counter ── */}
      <div className="px-4 pt-3 pb-1">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs" style={{ color: '#A8CCFF' }}>
            {completedCount} / {habits.length} completed
          </span>
          <span className="text-[9px]" style={{ color: SL_LABEL }}>
            {Math.round(progressRatio * 100)}%
          </span>
        </div>
        <XPBar progress={progressRatio} color={SL_BLUE} />
      </div>

      {/* ── Habits list ── */}
      <div className="px-4 pb-4 pt-3">
        <div className="flex flex-col gap-2">
          {habits.length === 0 ? (
            <div className="flex items-center justify-center py-12">
              <p className="text-xs text-center" style={{ color: 'rgba(30,127,255,0.25)' }}>
                No habits yet<br />Tap + to add one
              </p>
            </div>
          ) : (
            habits.map((habit) => {
              const cat = categoryInfo(habit.categoryId)
              const done = isCompleted(habit)
              const missed = isPastWeek && !done   // uncompleted in a past week
              const dim = done || missed
              const isActive = activeHabit === habit.id

              return (
                <div key={habit.id} className="relative group">
                  {/* Habit card */}
                  <button
                    onClick={() => { if (!isPastWeek) setActiveHabit(isActive ? null : habit.id) }}
                    className="w-full text-left relative"
                    style={{ boxShadow: '0 0 6px rgba(30,127,255,0.18)', cursor: isPastWeek ? 'default' : 'pointer' }}
                  >
                    <div className="absolute inset-0" style={{ background: 'rgba(30, 127, 255, 0.18)' }} />

                    <span className="absolute top-0 left-0 w-2 h-2 border-t border-l" style={{ borderColor: SL_BLUE }} />
                    <span className="absolute top-0 right-0 w-2 h-2 border-t border-r" style={{ borderColor: SL_BLUE }} />
                    <span className="absolute bottom-0 left-0 w-2 h-2 border-b border-l" style={{ borderColor: SL_BLUE }} />
                    <span className="absolute bottom-0 right-0 w-2 h-2 border-b border-r" style={{ borderColor: SL_BLUE }} />

                    <div
                      className="relative m-[1px] px-3 py-2 flex items-center gap-3"
                      style={{
                        background: dim ? 'rgba(3, 10, 24, 0.6)' : 'rgba(3, 10, 24, 0.92)',
                        opacity: dim ? 0.55 : 1,
                      }}
                    >
                      {done ? (
                        <Check size={16} style={{ color: SL_BLUE, flexShrink: 0 }} />
                      ) : (
                        <Circle size={16} style={{ color: missed ? 'rgba(120,132,156,0.4)' : 'rgba(30,127,255,0.4)', flexShrink: 0 }} />
                      )}

                      <div className="flex-1 min-w-0">
                        <p
                          className="text-sm font-semibold leading-tight"
                          style={{ color: dim ? '#4A6090' : 'white' }}
                        >
                          {habit.name}
                        </p>
                        {cat && (
                          <div className="flex items-center gap-1.5 mt-1">
                            <CategoryIcon name={cat.icon} color={dim ? '#4A6090' : cat.color} size={10} />
                            <span className="text-[10px]" style={{ color: dim ? '#4A6090' : SL_LABEL }}>
                              {cat.name}
                            </span>
                          </div>
                        )}
                      </div>

                      <div className="text-right shrink-0">
                        <p
                          className="text-[11px] font-bold"
                          style={{ color: dim ? '#4A6090' : cat?.color ?? SL_BLUE }}
                        >
                          +{habit.xpReward}
                        </p>
                        <p
                          className="text-[8px] uppercase tracking-[0.1em]"
                          style={{ color: dim ? '#3A5070' : SL_LABEL }}
                        >
                          XP
                        </p>
                      </div>
                    </div>
                  </button>

                  {/* Action popup */}
                  {isActive && (
                    <div
                      className="absolute right-0 z-20 flex gap-2 p-2 mt-1"
                      style={{
                        background: 'rgba(3,10,24,0.98)',
                        border: `1px solid ${SL_BLUE}`,
                        boxShadow: `0 4px 20px rgba(30,127,255,0.3)`,
                      }}
                      onClick={(e) => e.stopPropagation()}
                    >
                      {!done && (
                        <button
                          onClick={() => handleComplete(habit)}
                          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold"
                          style={{ background: `${SL_BLUE}22`, color: SL_BLUE, border: `1px solid ${SL_BLUE}` }}
                        >
                          <Check size={12} /> Done
                        </button>
                      )}
                      <button
                        onClick={() => handleDelete(habit.id)}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold"
                        style={{ background: 'rgba(239,68,68,0.15)', color: '#EF4444', border: '1px solid rgba(239,68,68,0.4)' }}
                      >
                        <Trash2 size={12} /> Delete
                      </button>
                    </div>
                  )}
                </div>
              )
            })
          )}
        </div>
      </div>

      {/* ── FAB ── */}
      <button
        onClick={() => setShowAddForm(true)}
        aria-label="Add habit"
        className="fixed right-5 w-12 h-12 flex items-center justify-center z-30"
        style={{
          bottom: 'calc(6rem + var(--sab))',
          background: SL_BLUE,
          boxShadow: `0 0 20px rgba(30,127,255,0.6)`,
          clipPath: 'polygon(8px 0%, 100% 0%, calc(100% - 8px) 100%, 0% 100%)',
        }}
      >
        <Plus size={22} color="white" />
      </button>

      {showAddForm && (
        <AddHabitForm
          selectedISO={selectedISO}
          selectedDayLabel={`${DAY_LABELS[selectedDow]}, ${selectedDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`}
          onAdd={addHabit}
          onClose={() => setShowAddForm(false)}
        />
      )}
    </div>
  )
}
