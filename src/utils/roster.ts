// What this app owns on LevelUp's behalf, mirrored from LevelUp's
// src/utils/activityTemplates.ts.
//
// HabitTracker has taken over LevelUp's Habits, Tasks and Vices tabs outright.
// Everything is planned and checked off HERE; LevelUp only receives the
// completions over the signals bus (see cloudSignal.ts) and awards the XP.
//
// Every `activityId` below MUST exist in LevelUp's ACTIVITY_TEMPLATES before a
// build that sends it ships — LevelUp skips unknown ids permanently. The point
// values are mirrored for display only: LevelUp scores from its own template,
// so a drift here costs a wrong number on screen, not wrong XP.

import type { ViceType } from '../types'

/** A LevelUp category this app writes to. Colours and icons mirror LevelUp's. */
export interface CategoryInfo {
  id: string
  name: string
  color: string
  /** lucide-react icon name, resolved by CategoryIcon. */
  icon: string
}

export const CATEGORIES: CategoryInfo[] = [
  { id: 'intellect',        name: 'Intelligence',                 color: '#F59E0B', icon: 'Brain'         },
  { id: 'spiritual',        name: 'Spirituality & Mental Health', color: '#14B8A6', icon: 'Sparkles'      },
  { id: 'grooming',         name: 'Grooming',                     color: '#EC4899', icon: 'Shirt'         },
  { id: 'responsibilities', name: 'Responsibilities',             color: '#F97316', icon: 'ClipboardList' },
]

/** Categories habits can be picked from - LevelUp's, minus Health (ProtocolsTracker) and Finance (FinancialTracker). */
export const HABIT_CATEGORY_IDS = ['intellect', 'spiritual', 'grooming']

export interface RosterActivity {
  /** LevelUp ACTIVITY_TEMPLATES id — the `activity_id` put on the wire. */
  activityId: string
  /** Exactly LevelUp's template name — the LevelUp import matches on it. */
  name: string
  categoryId: string
  basePoints: number
}

/**
 * Every habit you can add. LevelUp's templates in the habit categories, minus
 * the Health attribute, which ProtocolsTracker owns outright, Financial
 * Well-Being, which FinancialTracker owns outright, and `study_math`
 * (WeeklyPlanner). Offering those here would award their XP twice.
 */
export const HABIT_ROSTER: RosterActivity[] = [
  // Intelligence
  { activityId: 'reading', name: 'Reading', categoryId: 'intellect', basePoints: 15 },

  // Spirituality & Mental Health
  { activityId: 'meditation', name: 'Meditation',      categoryId: 'spiritual', basePoints: 15 },
  { activityId: 'gratitude',  name: 'Gratitude',       categoryId: 'spiritual', basePoints: 10 },
  { activityId: 'journaling', name: 'Journal', categoryId: 'spiritual', basePoints: 15 },

  // Grooming
  { activityId: 'shower',              name: 'Shower',                       categoryId: 'grooming', basePoints: 5 },
  { activityId: 'oral_health',         name: 'Morning Oral Health',          categoryId: 'grooming', basePoints: 5 },
  { activityId: 'oral_health_evening', name: 'Evening Oral Health Protocol', categoryId: 'grooming', basePoints: 5 },
  { activityId: 'barbershop',          name: 'Barbershop Visit',             categoryId: 'grooming', basePoints: 15 },
  { activityId: 'buy_clothes',         name: 'Buy New Clothes',              categoryId: 'grooming', basePoints: 20 },
  { activityId: 'new_glasses',         name: 'New Glasses',                  categoryId: 'grooming', basePoints: 25 },
  { activityId: 'skincare',            name: 'Skin Care Routine',            categoryId: 'grooming', basePoints: 10 },
  { activityId: 'mani_pedi',           name: 'Manicure/Pedicure',            categoryId: 'grooming', basePoints: 25 },
]

/** Every task is this one LevelUp template; the task's own name rides on `label`. */
export const TASK_ACTIVITY_ID = 'weekly_task'
export const TASK_XP = 10

export interface ViceDef {
  /** LevelUp template id, or null when there is nothing to send (0 XP). */
  activityId: string | null
  label: string
  xp: number
}

// All vice XP goes to Health in LevelUp. `weed_credit` and `weed_over` are
// retired: weed ran on a weekly credit budget until Sep 2026. Entries logged
// under those rules keep the label and the XP they were given, but neither is
// created now, and both carry a null activityId, so re-deriving the signals
// can never re-send one.
export const VICE_DEFS: Record<ViceType, ViceDef> = {
  no_weed:          { activityId: 'vice_no_weed',          label: 'No Weed',            xp: 10  },
  weed_credit:      { activityId: null,                    label: 'Weed · Credit Used', xp: 0   },
  weed_over:        { activityId: null,                    label: 'Weed · Over Budget', xp: -15 },
  no_porn:          { activityId: 'vice_no_porn',          label: 'No Porn',            xp: 15  },
  no_food_delivery: { activityId: 'vice_no_food_delivery', label: 'No Food Delivery',   xp: 10  },
  drinks_3plus:     { activityId: 'vice_drinks_3plus',     label: '3+ Drinks',          xp: -10 },
}

/** The weed card's entry types - at most one per day; two are retired. */
export const WEED_TYPES: ViceType[] = ['no_weed', 'weed_credit', 'weed_over']

/** Every activity id this app may put on the wire. */
export const LEVELUP_ACTIVITY_IDS: string[] = [
  ...HABIT_ROSTER.map((a) => a.activityId),
  TASK_ACTIVITY_ID,
  ...Object.values(VICE_DEFS).flatMap((v) => (v.activityId ? [v.activityId] : [])),
]

export function rosterActivity(activityId: string): RosterActivity | undefined {
  return HABIT_ROSTER.find((a) => a.activityId === activityId)
}

export function categoryInfo(categoryId: string): CategoryInfo | undefined {
  return CATEGORIES.find((c) => c.id === categoryId)
}
