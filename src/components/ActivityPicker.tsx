import { useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { CategoryIcon } from './CategoryIcon'
import { CATEGORIES, HABIT_CATEGORY_IDS, HABIT_ROSTER } from '../utils/roster'

const SL_DIM   = 'rgba(30,127,255,0.12)'
const SL_LABEL = '#3A7FCC'

interface ActivityPickerProps {
  selectedActivityId: string
  onSelectActivityId: (id: string) => void
}

/** Attribute → activity, two-step, over the habit roster. */
export function ActivityPicker({ selectedActivityId, onSelectActivityId }: ActivityPickerProps) {
  const [selectedCategoryId, setSelectedCategoryId] = useState('')
  const [showCategoryPicker, setShowCategoryPicker] = useState(false)
  const [showActivityPicker, setShowActivityPicker] = useState(false)

  const allowedCategories = CATEGORIES.filter((c) => HABIT_CATEGORY_IDS.includes(c.id))
  const selectedCategory = allowedCategories.find((c) => c.id === selectedCategoryId)
  const activitiesForCategory = HABIT_ROSTER.filter((a) => a.categoryId === selectedCategoryId)
  const selectedActivity = activitiesForCategory.find((a) => a.activityId === selectedActivityId)

  function handleSelectCategory(id: string) {
    setSelectedCategoryId(id)
    setShowCategoryPicker(false)
    if (selectedActivityId) onSelectActivityId('')
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Box 1: Attribute */}
      <div>
        <label className="text-[9px] uppercase tracking-[0.2em] block mb-1.5" style={{ color: SL_LABEL }}>
          Attribute
        </label>
        <button
          type="button"
          onClick={() => setShowCategoryPicker(!showCategoryPicker)}
          className="w-full flex items-center gap-2 px-3 py-2.5 text-sm text-white focus:outline-none"
          style={{ background: 'rgba(30,127,255,0.06)', border: `1px solid ${SL_DIM}` }}
        >
          {selectedCategory && (
            <CategoryIcon name={selectedCategory.icon} color={selectedCategory.color} size={14} />
          )}
          <span className="flex-1 text-left">{selectedCategory?.name ?? 'Select attribute'}</span>
          <ChevronDown
            size={14}
            className={`transition-transform ${showCategoryPicker ? 'rotate-180' : ''}`}
            style={{ color: SL_LABEL }}
          />
        </button>

        {showCategoryPicker && (
          <div className="mt-2 rounded-lg border overflow-hidden max-h-40 overflow-y-auto" style={{ borderColor: SL_DIM }}>
            {allowedCategories.map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => handleSelectCategory(cat.id)}
                className="w-full flex items-center gap-2 px-3 py-2.5 text-sm text-white text-left border-b last:border-0"
                style={{
                  background: selectedCategoryId === cat.id ? 'rgba(30,127,255,0.15)' : 'rgba(30,127,255,0.06)',
                  borderColor: SL_DIM,
                }}
              >
                <CategoryIcon name={cat.icon} color={cat.color} size={14} />
                <span className="flex-1">{cat.name}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Box 2: Activity */}
      <div>
        <label className="text-[9px] uppercase tracking-[0.2em] block mb-1.5" style={{ color: SL_LABEL }}>
          Habit
        </label>
        <button
          type="button"
          disabled={!selectedCategoryId}
          onClick={() => setShowActivityPicker(!showActivityPicker)}
          className="w-full flex items-center gap-2 px-3 py-2.5 text-sm text-white focus:outline-none disabled:opacity-40"
          style={{ background: 'rgba(30,127,255,0.06)', border: `1px solid ${SL_DIM}` }}
        >
          <span className="flex-1 text-left">
            {selectedActivity?.name ?? (selectedCategoryId ? 'Select habit' : 'Select an attribute first')}
          </span>
          <ChevronDown
            size={14}
            className={`transition-transform ${showActivityPicker ? 'rotate-180' : ''}`}
            style={{ color: SL_LABEL }}
          />
        </button>

        {showActivityPicker && selectedCategoryId && (
          <div className="mt-2 rounded-lg border overflow-hidden max-h-40 overflow-y-auto" style={{ borderColor: SL_DIM }}>
            {activitiesForCategory.map((activity) => (
              <button
                key={activity.activityId}
                type="button"
                onClick={() => {
                  onSelectActivityId(activity.activityId)
                  setShowActivityPicker(false)
                }}
                className="w-full flex items-center gap-2 px-3 py-2.5 text-sm text-white text-left border-b last:border-0"
                style={{
                  background: selectedActivityId === activity.activityId ? 'rgba(30,127,255,0.15)' : 'rgba(30,127,255,0.06)',
                  borderColor: SL_DIM,
                }}
              >
                <span className="flex-1">{activity.name}</span>
                <span style={{ color: SL_LABEL, fontSize: '12px' }}>({activity.basePoints})</span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
