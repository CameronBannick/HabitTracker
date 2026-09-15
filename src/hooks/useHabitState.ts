import { useCallback, useEffect, useRef, useState } from 'react'
import { App as CapApp } from '@capacitor/app'
import type { AppState, Habit, WeeklyTask } from '../types'
import { emptyState, hydrate, isEmptyState, loadState, saveState } from '../utils/storage'
import { addDays, fromLocalISODate, todayISO, toLocalISODate } from '../utils/date'
import { fetchLatestBackup, pushBackup } from '../utils/cloudBackup'
import { markAlreadySignaled, signalCompletions } from '../utils/cloudSignal'
import { completionSignals } from '../utils/completions'
import { fetchLevelUpBackup, mapLevelUpState, mergeImport } from '../utils/levelupImport'
import { VICE_DEFS } from '../utils/roster'
import { resolveViceType, viceGroup, type ViceKind } from '../utils/vices'

export type ImportResult =
  | { status: 'ok'; habits: number; tasks: number; vices: number }
  | { status: 'unreachable' }
  | { status: 'ledger-failed' }

export function useHabitState() {
  const [state, setState] = useState<AppState>(() => loadState() ?? emptyState())
  const [lastBackupAt, setLastBackupAt] = useState<string | null>(null)

  // 1. Persist the whole state on every change.
  useEffect(() => {
    saveState(state)
  }, [state])

  // 2. Auto-backup: mirror the state to Supabase, debounced so a burst of
  //    changes produces one snapshot. Empty state is never pushed, so a fresh
  //    install can't bury a good backup under a blank one before you restore.
  //
  //    A timer alone is not enough: the usual gesture is "tick a habit, lock
  //    the phone", and Android suspends the WebView's timers the moment it
  //    backgrounds. So `dirty` tracks whether the latest state has reached the
  //    cloud, and the lifecycle effect below flushes on the way out.
  const stateRef = useRef(state)
  const dirty = useRef(false)

  const flush = useCallback(async (keepalive = false): Promise<boolean> => {
    const snapshot = stateRef.current
    if (isEmptyState(snapshot)) return false
    const ok = await pushBackup(snapshot, keepalive)
    if (ok) {
      dirty.current = false
      setLastBackupAt(new Date().toISOString())
    }
    return ok
  }, [])

  useEffect(() => {
    stateRef.current = state
    dirty.current = true
    const timer = setTimeout(() => void flush(), 3_000)
    return () => clearTimeout(timer)
  }, [state, flush])

  useEffect(() => {
    function onHide() {
      if (dirty.current && document.visibilityState === 'hidden') void flush(true)
    }
    document.addEventListener('visibilitychange', onHide)
    const pause = CapApp.addListener('pause', () => {
      if (dirty.current) void flush(true)
    })
    return () => {
      document.removeEventListener('visibilitychange', onHide)
      void pause.then((h) => h.remove()).catch(() => undefined)
    }
  }, [flush])

  // Restore is always explicit (button press) so a fresh install can never
  // clobber good data automatically. The signal ledger is deliberately NOT
  // primed from the backup: re-sent completions are no-ops in LevelUp (same
  // occurrence keys), while priming could swallow one that never got sent.
  const restoreFromCloud = useCallback(async (): Promise<boolean> => {
    const backup = await fetchLatestBackup()
    if (!backup) return false
    const when = new Date(backup.createdAt).toLocaleString()
    if (!window.confirm(`Restore cloud backup from ${when}? This replaces all data on this device.`)) return false
    saveState(backup.state)
    window.location.reload()
    return true
  }, [])

  const backupNow = useCallback((): Promise<boolean> => flush(), [flush])

  // 3. Cross-app signal to LevelUp — one signal per completion, 1-for-1.
  //    Derived from state, not fired from button handlers, so a completion made
  //    offline still reaches the bus on a later change.
  useEffect(() => {
    signalCompletions(completionSignals(state))
  }, [state])

  // 4. One-time import of LevelUp's habits, tasks and vices (utils/levelupImport.ts).
  const importFromLevelUp = useCallback(async (): Promise<ImportResult> => {
    const backup = await fetchLevelUpBackup()
    if (!backup) return { status: 'unreachable' }
    const slice = mapLevelUpState(backup, todayISO())
    // LevelUp already scored every completion in here. Mark them sent BEFORE
    // they reach state, or the emitter above would post them straight back
    // under our occurrence keys and LevelUp would award the XP a second time.
    const keys = completionSignals({ ...emptyState(), ...slice }).map((s) => s.occurrenceKey)
    if (!markAlreadySignaled(keys)) return { status: 'ledger-failed' }
    setState((s) => mergeImport(s, slice))
    return {
      status: 'ok',
      habits: slice.habits.length,
      tasks: slice.weeklyTasks.length,
      vices: slice.viceLog.length,
    }
  }, [])

  // Runs automatically only on a brand-new install. If LevelUp is unreachable
  // then, Settings offers the same import by hand.
  const autoImportTried = useRef(false)
  useEffect(() => {
    if (autoImportTried.current) return
    autoImportTried.current = true
    const s = stateRef.current
    if (s.importedFromLevelUp || !isEmptyState(s)) return
    void importFromLevelUp()
  }, [importFromLevelUp])

  // ── Habits ─────────────────────────────────────────────────────────────────

  const addHabit = useCallback((habit: Habit): void => {
    setState((s) => ({ ...s, habits: [...s.habits, habit] }))
  }, [])

  const removeHabit = useCallback((id: string): void => {
    setState((s) => ({ ...s, habits: s.habits.filter((h) => h.id !== id) }))
  }, [])

  const completeHabit = useCallback((habit: Habit, dateISO: string): void => {
    const slot = `${habit.id}:${dateISO}`
    setState((s) => (s.completedHabits.includes(slot) ? s : { ...s, completedHabits: [...s.completedHabits, slot] }))
  }, [])

  // Pre-fill today/future days from the same weekday of the prior week as a
  // starting point. Idempotent and one-shot per day: a day is seeded at most
  // once (tracked in seededHabitDays), so later edits/deletions stick.
  const seedHabitsForWeek = useCallback((dateISOs: string[]): void => {
    const today = todayISO()
    setState((prev) => {
      let habits = prev.habits
      let seededHabitDays = prev.seededHabitDays
      let changed = false

      for (const d of dateISOs) {
        if (d < today || seededHabitDays.includes(d)) continue
        // Already has habits (user-curated) — mark handled, never overwrite.
        if (habits.some((h) => h.dateISO === d)) {
          seededHabitDays = [...seededHabitDays, d]
          changed = true
          continue
        }
        const srcISO = toLocalISODate(addDays(fromLocalISODate(d), -7))
        const source = habits.filter((h) => h.dateISO === srcISO)
        if (source.length === 0) continue // nothing to copy yet; leave unseeded
        // Deterministic ids: StrictMode double-invokes updaters, and a day is
        // seeded at most once, so (day, position) is unique.
        const copies = source.map((h, i) => ({ ...h, id: `seed-${d}-${i}`, dateISO: d }))
        habits = [...habits, ...copies]
        seededHabitDays = [...seededHabitDays, d]
        changed = true
      }

      return changed ? { ...prev, habits, seededHabitDays } : prev
    })
  }, [])

  // ── Weekly tasks ───────────────────────────────────────────────────────────

  const addTask = useCallback((task: WeeklyTask): void => {
    setState((s) => ({ ...s, weeklyTasks: [...s.weeklyTasks, task] }))
  }, [])

  const removeTask = useCallback((id: string): void => {
    setState((s) => ({ ...s, weeklyTasks: s.weeklyTasks.filter((t) => t.id !== id) }))
  }, [])

  const completeTask = useCallback((task: WeeklyTask): void => {
    const slot = `${task.id}:${todayISO()}`
    setState((s) =>
      s.completedWeeklyTasks.some((k) => k.startsWith(`${task.id}:`))
        ? s
        : { ...s, completedWeeklyTasks: [...s.completedWeeklyTasks, slot] }
    )
  }, [])

  // ── Vices ──────────────────────────────────────────────────────────────────

  /**
   * Log today's vice. Once per day per card (the weed card's three outcomes
   * share one slot), and locked once logged — LevelUp can't take XP back.
   * A weed day's credit-vs-over-budget is resolved here, once, and stored.
   */
  const logVice = useCallback((kind: ViceKind): void => {
    const id = crypto.randomUUID() // outside the updater: StrictMode runs updaters twice
    const dateISO = todayISO()
    setState((s) => {
      const group = viceGroup(kind)
      if (s.viceLog.some((e) => e.dateISO === dateISO && group.includes(e.type))) return s
      const type = resolveViceType(kind, s.viceLog, dateISO)
      return { ...s, viceLog: [...s.viceLog, { id, type, dateISO, xpImpact: VICE_DEFS[type].xp }] }
    })
  }, [])

  // ── Maintenance ────────────────────────────────────────────────────────────

  const importState = useCallback((next: AppState): void => {
    setState(hydrate(next))
  }, [])

  return {
    state,
    lastBackupAt, backupNow, restoreFromCloud,
    importFromLevelUp, importState,
    addHabit, removeHabit, completeHabit, seedHabitsForWeek,
    addTask, removeTask, completeTask,
    logVice,
  }
}

export type HabitApp = ReturnType<typeof useHabitState>
