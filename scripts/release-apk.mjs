// release-apk.mjs — one command to (re)build the Android APK and optionally
// publish it to Cameron's App Store.
//
//   npm run release:apk                 build APK only
//   npm run release:apk -- --publish    build + publish, auto-bumping the PATCH
//                                       version from the store catalog (1.0.0 -> 1.0.1)
//   npm run release:apk -- 1.1.0 --publish   publish an explicit version instead
//   npm run release:apk -- --icons      also regenerate launcher icons/splash first
//
// Requires JDK 21 + Android SDK. JAVA_HOME and ANDROID_HOME are normally set
// at User scope; this script verifies them.

import { execSync } from 'node:child_process'
import { existsSync, readFileSync, statSync } from 'node:fs'
import path from 'node:path'
import process from 'node:process'

const root = process.cwd()
const isWin = process.platform === 'win32'

// --- args ---
const args = process.argv.slice(2)
const flags = new Set(args.filter((a) => a.startsWith('--')))
const explicitVersion = args.find((a) => !a.startsWith('--'))
const doPublish = flags.has('--publish')
const doIcons = flags.has('--icons')

// OneDrive doesn't allow apostrophes in folder names, so the actual sibling
// folder is "Cameron-s-App-Store", not the store's display name.
const STORE_DIR = path.resolve(root, "..", "Cameron-s-App-Store")

// Store identity. This file started life as a copy of WeeklyPlanner's, so
// these MUST stay pointed at this app — add-app.ps1 upserts by id, and a stale
// id would overwrite another app's entry with this APK. The id is also baked
// into the published apk/icon filenames: never rename it once published.
const STORE_ID = 'habit-tracker'
const STORE_NAME = 'HabitTracker'
const STORE_TAGLINE = 'Daily habits, weekly tasks and vices, fed to LevelUp'
const STORE_DESCRIPTION =
  'Owns three areas for LevelUp: daily habits, weekly tasks and vices. Plan habits day by day (each week ' +
  'pre-fills from the last), keep a weekly to-do list, and track vices with a budget of 4 weed credits a ' +
  'week, No Porn and 3+ Drinks. Every check-off lands in LevelUp with its XP automatically. ' +
  'Styled after the Solo Leveling System. Works fully offline.'
const STORE_CATEGORY = 'Productivity'
const APK_OUT = path.join(root, 'android', 'app', 'build', 'outputs', 'apk', 'debug', 'app-debug.apk')

// Version: an explicit arg always wins. Otherwise auto-increment the PATCH of the
// version currently published in the store catalog (1.0.0 -> 1.0.1 -> 1.0.2 ...).
function nextPatchFromCatalog() {
  try {
    // catalog.json is written with a UTF-8 BOM by add-app.ps1 — strip it.
    let raw = readFileSync(path.join(STORE_DIR, 'catalog.json'), 'utf8')
    if (raw.charCodeAt(0) === 0xFEFF) raw = raw.slice(1)
    const app = (JSON.parse(raw).apps || []).find((a) => a.id === STORE_ID)
    const m = app?.version?.match(/^(\d+)\.(\d+)\.(\d+)$/)
    if (m) return `${m[1]}.${m[2]}.${Number(m[3]) + 1}`
  } catch { /* no catalog or unparseable — fall through to default */ }
  return null
}
const version = explicitVersion || nextPatchFromCatalog() || '1.0.0'

function run(cmd, opts = {}) {
  console.log(`\n▸ ${cmd}`)
  execSync(cmd, { stdio: 'inherit', cwd: root, ...opts })
}

function checkToolchain() {
  const javaHome = process.env.JAVA_HOME
  if (javaHome && existsSync(path.join(javaHome, 'bin'))) {
    process.env.PATH = `${path.join(javaHome, 'bin')}${path.delimiter}${process.env.PATH}`
  }
  try {
    execSync('java -version', { stdio: 'pipe' })
  } catch {
    console.error('✖ Java not found. Install JDK 21 and set JAVA_HOME.')
    process.exit(1)
  }
  if (!process.env.ANDROID_HOME && !process.env.ANDROID_SDK_ROOT) {
    console.warn('⚠ ANDROID_HOME is not set in this shell. Open a fresh terminal, or the Gradle build may fail to find the SDK.')
  }
}

checkToolchain()

// 1. Build web assets
run('npm run build')

// 2. (optional) regenerate native icons + splash from public/icons/icon-1024.png
if (doIcons) {
  run('node generate-icons.mjs')
  run('npx @capacitor/assets generate --android --iconBackgroundColor "#040810" --splashBackgroundColor "#040810"')
}

// 3. Copy web assets into the native project
run('npx cap sync android')

// 4. Build the debug APK
const gradlew = isWin ? 'android\\gradlew.bat' : './android/gradlew'
run(`${gradlew} -p android assembleDebug --no-daemon`)

if (!existsSync(APK_OUT)) {
  console.error(`✖ Build reported success but APK not found at ${APK_OUT}`)
  process.exit(1)
}
const sizeMB = (statSync(APK_OUT).size / (1024 * 1024)).toFixed(2)
console.log(`\n✓ APK built: ${APK_OUT} (${sizeMB} MB)`)

// 5. (optional) publish into Cameron's App Store
if (doPublish) {
  if (!existsSync(STORE_DIR)) {
    console.error(`✖ Store folder not found at ${STORE_DIR}; skipping publish.`)
    process.exit(1)
  }
  const icon = path.join(root, 'public', 'icons', 'icon-512.png')
  const psq = (s) => s.replace(/'/g, "''")
  const ps = [
    `& '${psq(path.join(STORE_DIR, 'add-app.ps1'))}'`,
    `-Apk '${psq(APK_OUT)}'`,
    `-Name '${psq(STORE_NAME)}'`,
    `-Tagline '${psq(STORE_TAGLINE)}'`,
    `-Description '${psq(STORE_DESCRIPTION)}'`,
    `-Category '${psq(STORE_CATEGORY)}'`,
    `-Version '${psq(version)}'`,
    `-Id '${psq(STORE_ID)}'`,
    `-Icon '${psq(icon)}'`,
  ].join(' ')
  run(`powershell -NoProfile -ExecutionPolicy Bypass -Command "${ps}"`)
  console.log(`\n✓ Added to the store as v${version}. To publish, run in "${STORE_DIR}":`)
  console.log(`    git add . ; git commit -m "Update ${STORE_NAME} ${version}" ; git push`)
} else {
  console.log('\n(Use --publish to copy this APK into Cameron\'s App Store and update the catalog.)')
}
