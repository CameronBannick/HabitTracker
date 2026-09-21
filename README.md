| Clean weed day | `vice_no_weed` | `habit-tracker:vice:<entryId>` |
| Weed: clean day | +10 Health |
# HabitTracker

A LevelUp satellite app. It owns what used to be LevelUp's **Habits**, **Tasks**
and **Vices** tabs: you plan and check things off here, and every completion is
sent to LevelUp, which awards the XP. LevelUp no longer has those tabs.

Built like its siblings (WeeklyPlanner, ProtocolsTracker): React + Vite +
Tailwind, wrapped with Capacitor for Android, styled after the Solo Leveling
System, fully offline-capable.

## What it does

- **Habits:** day-by-day habit list with week navigation. Each new day starts
  as a copy of the same weekday last week. The habit roster mirrors LevelUp's
  habit templates, minus the Health attribute, which ProtocolsTracker owns
  outright, and *Study Math* (WeeklyPlanner), which WeeklyPlanner reports.
- **Tasks:** a free-text to-do list for the current week.
- **Vices:** one log per card per day, today only, locked once logged.

## XP (all scored by LevelUp)

| Action | XP |
| --- | --- |
| Habit | its LevelUp template value, to its attribute |
| Weekly task | +10 Responsibilities |
| Weed: clean day | +10 Health |
| No Porn | +15 Health |
| No Food Delivery | +10 Health |
| 3+ Drinks | −10 Health |

Weed ran on a weekly credit budget until Sep 2026. Those entries stay in the
log with the XP LevelUp already gave them, but a clean day is all this app
logs now. Vices give Health XP but **never** count toward LevelUp's Health
daily quest; habits do.

## How it talks to LevelUp

Over the shared Supabase `signals` bus, 1-for-1 (see LevelUp's
`docs/SATELLITE-INTEGRATION.md`). Source: `habit-tracker`.

| Completion | `activity_id` | `occurrence_key` |
| --- | --- | --- |
| Habit | its roster id (e.g. `reading`) | `habit-tracker:habit:<habitId>:<date>` |
| Task | `weekly_task` (+ `label` = task name) | `habit-tracker:task:<taskId>` |
| Clean weed day | `vice_no_weed` | `habit-tracker:vice:<entryId>` |
| No Porn / 3+ Drinks | `vice_no_porn` / `vice_drinks_3plus` | `habit-tracker:vice:<entryId>` |
| No Food Delivery | `vice_no_food_delivery` | `habit-tracker:vice:<entryId>` |

Signals are derived from state
(`src/utils/completions.ts`), so a completion made offline goes out later.

> **Release LevelUp first.** LevelUp permanently skips an `activity_id` it
> doesn't know. Every id above must exist in the LevelUp build installed on the
> phone before this app sends it.

## First launch: import from LevelUp

On a fresh install the app reads LevelUp's latest cloud backup (read-only) and
copies over this and last week's habits, this week's tasks, and this week's
No Weed / No Porn logs. Completions that came from LevelUp are recorded as
already sent **before** they reach state, so LevelUp never gets them a second
time. If you're offline on first launch, use **System → Import from LevelUp**.

## Development

```powershell
npm install
npm run dev
```

To test without touching the phone's LevelUp, point both apps at a dev target:

```powershell
$env:VITE_SIGNAL_TARGET = 'levelup-dev'; npm run dev
```

Clean up afterwards: `delete from signals where target_app = 'levelup-dev';`

## Release

```powershell
node generate-icons.mjs              # first time, or after changing the icon
npm run release:apk -- --publish     # build APK + upsert into Cameron's App Store
```

Then commit and push both this repo and `../Cameron-s-App-Store`. The store id
`habit-tracker` is permanent; it's baked into the APK and icon filenames.

## Layout

```
src/hooks/useHabitState.ts   the only state hook: persistence, backup, signals, import
src/utils/roster.ts          LevelUp mirror: categories, habit roster, vice XP, credit budget
src/utils/cloudSignal.ts     signals emitter (ledger + in-flight dedup)
src/utils/completions.ts     state → signal mapping
src/utils/vices.ts           weed-credit rules
src/utils/levelupImport.ts   one-time LevelUp hand-over
src/utils/cloudBackup.ts     habit_backups mirror (docs/CLOUD-BACKUP.md)
src/pages/                   Habits, Tasks, Vices, Settings
```
