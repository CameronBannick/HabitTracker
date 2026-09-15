import type { ViceEntry, ViceType } from '../types'
import { fromLocalISODate, weekISOOf } from './date'
import { WEED_CREDITS_PER_WEEK, WEED_TYPES } from './roster'

/** What the user tapped. A weed tap resolves to a stored ViceType at log time. */
export type ViceKind = 'weed_clean' | 'weed_use' | 'no_porn' | 'drinks_3plus'

/** Weed credits already spent in the Mon–Sun week containing `dateISO`. */
export function weedCreditsUsed(viceLog: ViceEntry[], dateISO: string): number {
  const week = weekISOOf(fromLocalISODate(dateISO))
  return viceLog.filter((e) => e.type === 'weed_credit' && weekISOOf(fromLocalISODate(e.dateISO)) === week).length
}

/** Entry types that share a once-per-day slot with `kind`. */
export function viceGroup(kind: ViceKind): ViceType[] {
  return kind === 'weed_clean' || kind === 'weed_use' ? WEED_TYPES : [kind]
}

/**
 * The type a tap is stored as. Over-budget only once all of the week's credits
 * are spent — and it is decided here, once, so logging an earlier day later in
 * the week can never reclassify (and re-signal) an entry already sent.
 */
export function resolveViceType(kind: ViceKind, viceLog: ViceEntry[], dateISO: string): ViceType {
  switch (kind) {
    case 'weed_clean':
      return 'no_weed'
    case 'weed_use':
      return weedCreditsUsed(viceLog, dateISO) < WEED_CREDITS_PER_WEEK ? 'weed_credit' : 'weed_over'
    default:
      return kind
  }
}
