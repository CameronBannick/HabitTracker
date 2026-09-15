// Day-bucket helpers, copied from LevelUp so both apps agree on day and week
// boundaries. These intentionally use the LOCAL calendar date, not UTC.
//
// Using `new Date().toISOString().slice(0,10)` returns the UTC date, which rolls
// over to "tomorrow" in the evening for negative-UTC timezones (e.g. 8pm in
// US-Eastern). All "which day does this belong to" keys must go through here so
// the day boundary matches the user's real midnight.

/** Local calendar date as YYYY-MM-DD. */
export function toLocalISODate(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

/** Parse a YYYY-MM-DD day key as LOCAL midnight (not UTC midnight). */
export function fromLocalISODate(iso: string): Date {
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(y, m - 1, d)
}

/** Today's local calendar date as YYYY-MM-DD. */
export function todayISO(): string {
  return toLocalISODate(new Date())
}

export const DAY_NAMES  = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN']
export const DAY_LABELS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']

/** Monday of the local week containing `date`, at local midnight. */
export function getMondayOf(date: Date): Date {
  const d = new Date(date)
  const day = d.getDay()                       // 0=Sun
  const diff = day === 0 ? -6 : 1 - day        // shift to Monday
  d.setDate(d.getDate() + diff)
  d.setHours(0, 0, 0, 0)
  return d
}

export function addDays(date: Date, n: number): Date {
  const d = new Date(date)
  d.setDate(d.getDate() + n)
  return d
}

/** The 7 local dates (Mon–Sun) of the week `weekOffset` weeks from the current week. */
export function weekDatesFromOffset(weekOffset: number): Date[] {
  const monday = addDays(getMondayOf(new Date()), weekOffset * 7)
  return Array.from({ length: 7 }, (_, i) => addDays(monday, i))
}

/** ISO 8601 week string for the local week containing `date`, e.g. "2026-W25". */
export function weekISOOf(date: Date): string {
  const dayOfWeek = (date.getDay() + 6) % 7   // Mon=0, Sun=6
  const thursday = new Date(date)
  thursday.setDate(date.getDate() + (3 - dayOfWeek))
  thursday.setHours(0, 0, 0, 0)
  const year = thursday.getFullYear()
  const jan4 = new Date(year, 0, 4)
  const jan4Day = (jan4.getDay() + 6) % 7
  const week1Mon = new Date(jan4)
  week1Mon.setDate(jan4.getDate() - jan4Day)
  const weekNum = Math.floor(
    (thursday.getTime() - week1Mon.getTime()) / (7 * 24 * 60 * 60 * 1000)
  ) + 1
  return `${year}-W${String(weekNum).padStart(2, '0')}`
}

/** ISO 8601 week string for the current local week, e.g. "2026-W25". */
export function currentWeekISO(): string {
  return weekISOOf(new Date())
}
