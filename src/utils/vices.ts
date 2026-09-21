import type { ViceType } from '../types'
import { WEED_TYPES } from './roster'

/** What the user tapped. */
export type ViceKind = 'weed_clean' | 'no_porn' | 'drinks_3plus'

/**
 * Entry types that share a once-per-day slot with `kind`. A weed tap is still
 * blocked by a retired `weed_credit` or `weed_over` entry on the same day.
 */
export function viceGroup(kind: ViceKind): ViceType[] {
  return kind === 'weed_clean' ? WEED_TYPES : [kind]
}

/**
 * The type a tap is stored as. A clean day is the only weed entry written now:
 * using is simply not logged, and neither retired type can be created again.
 */
export function resolveViceType(kind: ViceKind): ViceType {
  return kind === 'weed_clean' ? 'no_weed' : kind
}
