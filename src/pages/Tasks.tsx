import { useState, type FormEvent } from 'react'
import { Plus, Check, Circle, Trash2, X } from 'lucide-react'
import type { WeeklyTask } from '../types'
import type { HabitApp } from '../hooks/useHabitState'
import { CategoryIcon } from '../components/CategoryIcon'
import { XPBar } from '../components/XPBar'
import { categoryInfo, TASK_XP } from '../utils/roster'
import { currentWeekISO, getMondayOf } from '../utils/date'

const SL_BLUE  = '#1E7FFF'
const SL_DIM   = 'rgba(30,127,255,0.12)'
const SL_LABEL = '#3A7FCC'

const RESPONSIBILITIES = categoryInfo('responsibilities')

// ── Add Task Modal ─────────────────────────────────────────
interface AddTaskFormProps {
  onAdd: (task: WeeklyTask) => void
  onClose: () => void
}

function AddTaskForm({ onAdd, onClose }: AddTaskFormProps) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!name.trim()) return
    onAdd({
      id: crypto.randomUUID(),
      name: name.trim(),
      description: description.trim() || undefined,
      xpReward: TASK_XP,
      weekISO: currentWeekISO(),
    })
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end" onClick={onClose}>
      <div
        className="w-full"
        style={{ background: 'rgba(3,10,24,0.99)', borderTop: `2px solid ${SL_BLUE}`, boxShadow: `0 -8px 40px rgba(30,127,255,0.25)`, paddingBottom: 'var(--sab)' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 pt-4 pb-3" style={{ borderBottom: `1px solid ${SL_DIM}` }}>
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rotate-45" style={{ background: SL_BLUE }} />
            <span className="text-[10px] uppercase tracking-[0.35em] font-semibold" style={{ color: SL_BLUE }}>
              Add Task
            </span>
          </div>
          <button onClick={onClose} aria-label="Close"><X size={18} style={{ color: SL_LABEL }} /></button>
        </div>

        <form onSubmit={handleSubmit} className="px-4 py-4 flex flex-col gap-4">
          <div>
            <label className="text-[9px] uppercase tracking-[0.2em] block mb-1.5" style={{ color: SL_LABEL }}>
              Task Name
            </label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Oil change, dentist appt, taxes..."
              className="w-full px-3 py-2.5 text-sm text-white placeholder:text-white/25 focus:outline-none"
              style={{ background: 'rgba(30,127,255,0.06)', border: `1px solid ${SL_DIM}` }}
              autoFocus
              required
            />
          </div>

          <div>
            <label className="text-[9px] uppercase tracking-[0.2em] block mb-1.5" style={{ color: SL_LABEL }}>
              Notes (Optional)
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Any details..."
              className="w-full px-3 py-2.5 text-sm text-white placeholder:text-white/25 focus:outline-none resize-none"
              style={{ background: 'rgba(30,127,255,0.06)', border: `1px solid ${SL_DIM}` }}
              rows={2}
            />
          </div>

          <p className="text-[10px]" style={{ color: SL_LABEL }}>
            Awards <span style={{ color: RESPONSIBILITIES?.color, fontWeight: 'bold' }}>{TASK_XP} XP</span> to Responsibilities in LevelUp
          </p>

          <button
            type="submit"
            disabled={!name.trim()}
            className="w-full py-3.5 font-bold text-white text-sm disabled:opacity-50"
            style={{ background: SL_BLUE, boxShadow: `0 0 16px rgba(30,127,255,0.4)` }}
          >
            <Plus size={16} className="inline mr-2" />
            Add Task
          </button>
        </form>
      </div>
    </div>
  )
}

// ── Main page ──────────────────────────────────────────────
export function Tasks({ app }: { app: HabitApp }) {
  const { state, addTask, removeTask, completeTask } = app
  const [showAddForm, setShowAddForm] = useState(false)
  const [activeTask, setActiveTask] = useState<string | null>(null)

  const thisWeek = currentWeekISO()
  const tasks = state.weeklyTasks.filter((t) => t.weekISO === thisWeek)

  function isCompleted(task: WeeklyTask): boolean {
    return state.completedWeeklyTasks.some((slot) => slot.startsWith(`${task.id}:`))
  }

  const completedCount = tasks.filter(isCompleted).length
  const progressRatio = tasks.length > 0 ? completedCount / tasks.length : 0
  const weekLabel = `Week of ${getMondayOf(new Date()).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`

  function handleComplete(task: WeeklyTask) {
    completeTask(task)
    setActiveTask(null)
  }

  function handleDelete(id: string) {
    removeTask(id)
    setActiveTask(null)
  }

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
            Weekly Tasks
          </span>
          <div className="flex-1 border-b" style={{ borderColor: SL_DIM }} />
          <span className="text-[9px]" style={{ color: SL_LABEL }}>{weekLabel}</span>
        </div>

        <div className="flex items-center justify-between mb-2">
          <span className="text-xs" style={{ color: '#A8CCFF' }}>
            {completedCount} / {tasks.length} completed
          </span>
          <span className="text-[9px]" style={{ color: SL_LABEL }}>
            {Math.round(progressRatio * 100)}%
          </span>
        </div>

        <XPBar progress={progressRatio} color={SL_BLUE} />
      </div>

      {/* ── Task list ── */}
      <div className="px-4 pb-4">
        <div className="flex flex-col gap-2">
          {tasks.length === 0 ? (
            <div className="flex items-center justify-center py-12">
              <p className="text-xs text-center" style={{ color: 'rgba(30,127,255,0.25)' }}>
                No tasks this week<br />Tap + to add one
              </p>
            </div>
          ) : (
            tasks.map((task) => {
              const done = isCompleted(task)
              const isActive = activeTask === task.id

              return (
                <div key={task.id} className="relative group">
                  <button
                    onClick={() => setActiveTask(isActive ? null : task.id)}
                    className="w-full text-left relative"
                    style={{ boxShadow: '0 0 6px rgba(30,127,255,0.18)' }}
                  >
                    <div className="absolute inset-0" style={{ background: 'rgba(30, 127, 255, 0.18)' }} />
                    <span className="absolute top-0 left-0 w-2 h-2 border-t border-l" style={{ borderColor: SL_BLUE }} />
                    <span className="absolute top-0 right-0 w-2 h-2 border-t border-r" style={{ borderColor: SL_BLUE }} />
                    <span className="absolute bottom-0 left-0 w-2 h-2 border-b border-l" style={{ borderColor: SL_BLUE }} />
                    <span className="absolute bottom-0 right-0 w-2 h-2 border-b border-r" style={{ borderColor: SL_BLUE }} />

                    <div
                      className="relative m-[1px] px-3 py-2 flex items-center gap-3"
                      style={{
                        background: done ? 'rgba(3, 10, 24, 0.6)' : 'rgba(3, 10, 24, 0.92)',
                        opacity: done ? 0.55 : 1,
                      }}
                    >
                      {done ? (
                        <Check size={16} style={{ color: SL_BLUE, flexShrink: 0 }} />
                      ) : (
                        <Circle size={16} style={{ color: 'rgba(30,127,255,0.4)', flexShrink: 0 }} />
                      )}

                      <div className="flex-1 min-w-0">
                        <p
                          className="text-sm font-semibold leading-tight"
                          style={{ color: done ? '#4A6090' : 'white' }}
                        >
                          {task.name}
                        </p>
                        {task.description && (
                          <p
                            className="text-[11px] leading-tight mt-0.5"
                            style={{ color: done ? '#3A5070' : 'rgba(255,255,255,0.4)' }}
                          >
                            {task.description}
                          </p>
                        )}
                        {RESPONSIBILITIES && (
                          <div className="flex items-center gap-1.5 mt-1">
                            <CategoryIcon name={RESPONSIBILITIES.icon} color={done ? '#4A6090' : RESPONSIBILITIES.color} size={10} />
                            <span className="text-[10px]" style={{ color: done ? '#4A6090' : SL_LABEL }}>
                              {RESPONSIBILITIES.name}
                            </span>
                          </div>
                        )}
                      </div>

                      <div className="text-right shrink-0">
                        <p
                          className="text-[11px] font-bold"
                          style={{ color: done ? '#4A6090' : RESPONSIBILITIES?.color ?? SL_BLUE }}
                        >
                          +{task.xpReward}
                        </p>
                        <p
                          className="text-[8px] uppercase tracking-[0.1em]"
                          style={{ color: done ? '#3A5070' : SL_LABEL }}
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
                          onClick={() => handleComplete(task)}
                          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold"
                          style={{ background: `${SL_BLUE}22`, color: SL_BLUE, border: `1px solid ${SL_BLUE}` }}
                        >
                          <Check size={12} /> Done
                        </button>
                      )}
                      <button
                        onClick={() => handleDelete(task.id)}
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
        aria-label="Add task"
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
        <AddTaskForm
          onAdd={addTask}
          onClose={() => setShowAddForm(false)}
        />
      )}
    </div>
  )
}
