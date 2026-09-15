import { ChevronLeft, ChevronRight } from 'lucide-react'
import { DAY_NAMES, DAY_LABELS, toLocalISODate, todayISO } from '../utils/date'

const SL_BLUE  = '#1E7FFF'
const SL_DIM   = 'rgba(30,127,255,0.12)'
const SL_LABEL = '#3A7FCC'

interface WeekDatePickerProps {
  label: string
  weekDates: Date[]
  selectedDow: number
  onSelectDow: (i: number) => void
  onPrevWeek: () => void
  onNextWeek: () => void
}

export function WeekDatePicker({ label, weekDates, selectedDow, onSelectDow, onPrevWeek, onNextWeek }: WeekDatePickerProps) {
  const today = todayISO()
  const monday = weekDates[0]
  const selectedDate = weekDates[selectedDow]
  const isToday = toLocalISODate(selectedDate) === today

  return (
    <div
      className="px-4 pb-3 sticky top-0 z-30"
      style={{ background: 'rgba(4,8,16,0.98)', paddingTop: 'calc(1.25rem + var(--sat))' }}
    >
      <div className="flex items-center justify-between mb-4">
        <button onClick={onPrevWeek} aria-label="Previous week">
          <ChevronLeft size={20} style={{ color: SL_BLUE }} />
        </button>
        <div className="text-center">
          <div className="flex items-center gap-2 justify-center mb-0.5">
            <div className="w-1 h-1 rotate-45" style={{ background: SL_BLUE }} />
            <span className="text-[9px] uppercase tracking-[0.35em] font-semibold" style={{ color: SL_BLUE }}>
              {label}
            </span>
          </div>
          <p className="text-xs" style={{ color: SL_LABEL }}>
            {monday.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
            {' – '}
            {weekDates[6].toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
          </p>
        </div>
        <button onClick={onNextWeek} aria-label="Next week">
          <ChevronRight size={20} style={{ color: SL_BLUE }} />
        </button>
      </div>

      {/* Day chips */}
      <div className="grid grid-cols-7 gap-1">
        {weekDates.map((date, i) => {
          const iso = toLocalISODate(date)
          const isSelected = i === selectedDow
          const isTodayChip = iso === today
          return (
            <button
              key={i}
              onClick={() => onSelectDow(i)}
              className="flex flex-col items-center py-2 gap-0.5"
              style={{
                border: `1px solid ${isSelected ? SL_BLUE : SL_DIM}`,
                background: isSelected ? `${SL_BLUE}22` : 'transparent',
                boxShadow: isSelected ? `0 0 8px rgba(30,127,255,0.3)` : 'none',
              }}
            >
              <span className="text-[8px] font-bold uppercase" style={{ color: isSelected ? SL_BLUE : SL_LABEL }}>
                {DAY_NAMES[i]}
              </span>
              <span
                className="text-xs font-bold"
                style={{ color: isTodayChip ? SL_BLUE : isSelected ? '#A8CCFF' : '#4A6090' }}
              >
                {date.getDate()}
              </span>
            </button>
          )
        })}
      </div>

      {/* Selected day label */}
      <div className="flex items-center gap-2 mt-3" style={{ borderBottom: `1px solid ${SL_DIM}`, paddingBottom: '0.5rem' }}>
        <span className="text-sm font-bold text-white">{DAY_LABELS[selectedDow]}</span>
        {isToday && (
          <span
            className="text-[8px] font-bold uppercase tracking-widest px-2 py-0.5"
            style={{ color: SL_BLUE, border: `1px solid ${SL_BLUE}`, background: `${SL_BLUE}18` }}
          >
            Today
          </span>
        )}
        <span className="text-xs ml-auto" style={{ color: SL_LABEL }}>
          {selectedDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
        </span>
      </div>
    </div>
  )
}
