# Cloud Backup

HabitTracker mirrors its full state to the **same Supabase project LevelUp
uses**, `levelup-backup` (`njknlqvbmejagbsnikqe`), so every app backs up to one
place. It also uses that project's `signals` table for the cross-app completion
bus (see LevelUp's `docs/SATELLITE-INTEGRATION.md`).

- **URL:** `https://njknlqvbmejagbsnikqe.supabase.co`
- **Publishable anon key:** `sb_publishable_nNfKefHnghphPSO80wD-8Q_BT5TxgnQ`
  (safe to embed in shipped apps; single-user personal project, accepted tradeoff)

## Why a separate table

LevelUp's `backups` table is `(id, state, created_at)` with **no app column**,
and LevelUp's restore takes the newest row unconditionally. A HabitTracker
snapshot written there would be handed to LevelUp on its next restore and wipe
it. So this app has its own table with the same shape and policies, as
ProtocolsTracker does (`supplement_backups`).

HabitTracker does **read** LevelUp's `backups` table, once, for the first-launch
import (`src/utils/levelupImport.ts`). It never writes to it.

## Schema (already applied to the live project)

Append-only: anon can insert and select, never update or delete, so a bad or
empty push can never destroy an older good backup.

```sql
create table habit_backups (
  id bigint generated always as identity primary key,
  state jsonb not null,
  created_at timestamptz not null default now()
);
alter table habit_backups enable row level security;
create policy anon_insert on habit_backups for insert to anon with check (true);
create policy anon_select on habit_backups for select to anon using (true);
create index habit_backups_created_idx on habit_backups (created_at desc);
```

## App side

`src/utils/cloudBackup.ts`: `pushBackup(state, keepalive?)` and
`fetchLatestBackup()`, both fire-and-forget over PostgREST.

`src/hooks/useHabitState.ts`:

- **Auto-backup:** a 3s debounced effect on `state`. Empty state (no habits,
  tasks or vice logs) is skipped, so a fresh install can't bury a good backup
  under a blank one before you restore.
- **Flush on the way out:** a `dirty` ref tracks whether the newest state has
  reached the cloud, and `visibilitychange → hidden` plus Capacitor's `pause`
  event flush it with `fetch(..., { keepalive: true })`, so ticking a habit and
  locking the phone still backs up.
- **`restoreFromCloud()`:** explicit only (System → Restore). It confirms with
  the backup's timestamp, writes to localStorage and reloads. The signal ledger
  is not primed from the backup: re-sent completions carry the same occurrence
  keys, so LevelUp ignores them, whereas priming could swallow one that never
  got sent.
- **`backupNow()`:** manual push; updates the "Last …" readout.

System also has local **Export / Import** of the raw `habit_state` JSON as an
offline escape hatch.

## Verifying

- `npx tsc -b`
- Tick a habit, wait about 5s, then confirm a new row:
  `select id, created_at from habit_backups order by id desc limit 5;`
- System → Back Up Now shows "Backed up ✓"; Restore prompts with the snapshot's
  timestamp and reloads with that data.
