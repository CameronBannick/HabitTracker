// Cloud backup mirror of the localStorage state, stored in the same personal
// Supabase project LevelUp uses (`levelup-backup`). Own table though —
// LevelUp's `backups` table has no app column and its restore takes the newest
// row unconditionally, so a snapshot of ours in there would clobber LevelUp.
//
// The table is append-only (insert + select policies only), so a bad or empty
// push can never destroy an older good backup — restore always fetches the
// most recent row. See docs/CLOUD-BACKUP.md for the schema.
//
// The publishable key below is safe-by-design to embed in the shipped app,
// but since this is a single-user personal project, anyone with the key could
// read/write backups — an accepted tradeoff for simplicity.

import type { AppState } from '../types'

const SUPABASE_URL = 'https://njknlqvbmejagbsnikqe.supabase.co'
const SUPABASE_KEY = 'sb_publishable_nNfKefHnghphPSO80wD-8Q_BT5TxgnQ'

const TABLE = 'habit_backups'

const HEADERS = {
  apikey: SUPABASE_KEY,
  Authorization: `Bearer ${SUPABASE_KEY}`,
  'Content-Type': 'application/json',
}

// `keepalive` lets a request outlive the page being backgrounded — essential on
// Android, where locking the phone suspends the WebView and would otherwise kill
// an in-flight push. The spec caps keepalive bodies at 64KB, so oversized
// snapshots fall back to a normal request.
const KEEPALIVE_MAX_BYTES = 60_000

/**
 * Push a snapshot of the full app state. Returns true on success.
 * Pass `keepalive` when pushing from a lifecycle handler (page hidden / app
 * paused) so the browser finishes the request after the app goes away.
 */
export async function pushBackup(state: AppState, keepalive = false): Promise<boolean> {
  try {
    const body = JSON.stringify({ state })
    const res = await fetch(`${SUPABASE_URL}/rest/v1/${TABLE}`, {
      method: 'POST',
      headers: HEADERS,
      body,
      keepalive: keepalive && body.length <= KEEPALIVE_MAX_BYTES,
    })
    return res.ok
  } catch {
    return false // offline or unreachable — the next change will retry
  }
}

/** Fetch the most recent backup, or null if none exists / unreachable. */
export async function fetchLatestBackup(): Promise<{ state: AppState; createdAt: string } | null> {
  try {
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/${TABLE}?select=state,created_at&order=created_at.desc&limit=1`,
      { headers: HEADERS }
    )
    if (!res.ok) return null
    const rows = (await res.json()) as { state: AppState; created_at: string }[]
    if (rows.length === 0) return null
    return { state: rows[0].state, createdAt: rows[0].created_at }
  } catch {
    return null
  }
}
