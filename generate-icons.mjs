// generate-icons.mjs — render the launcher/PWA icons from one SVG master.
//
//   node generate-icons.mjs
//
// The mark is a checklist — two ticked boxes and one still open — which is the
// whole app: habits, tasks and vices, checked off a day at a time. Drawn in the
// System palette: SL blue on the app's near-black, with the UI's blue bloom.
//
// SAFE ZONE. icon-512 is declared `purpose: "any maskable"` in vite.config.ts
// and Capacitor crops the launcher icon to a circle, so all artwork stays
// inside the central circle (66% of the canvas). The furthest ink is the box
// corners, ≈290 art units from centre; at 596/560 that lands at ≈309px, inside
// the ≈338px safe radius with room for the bloom.
//
// Rasterised with sharp, which is already present via @capacitor/assets.

import sharp from 'sharp'
import fs from 'fs'
import path from 'path'

const SIZE = 1024
const SL_BLUE = '#1E7FFF'
const SL_PALE = '#A8CCFF'

const ART = 560
const BOX = 596
const scale = BOX / ART
const offset = (SIZE - BOX) / 2

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${SIZE}" height="${SIZE}" viewBox="0 0 ${SIZE} ${SIZE}">
  <defs>
    <radialGradient id="ground" cx="50%" cy="42%" r="70%">
      <stop offset="0%"   stop-color="#102F5C"/>
      <stop offset="45%"  stop-color="#08182F"/>
      <stop offset="100%" stop-color="#040810"/>
    </radialGradient>
    <filter id="bloom" x="-25%" y="-25%" width="150%" height="150%">
      <feGaussianBlur stdDeviation="7" result="blur"/>
      <feMerge>
        <feMergeNode in="blur"/>
        <feMergeNode in="SourceGraphic"/>
      </feMerge>
    </filter>
  </defs>

  <rect width="${SIZE}" height="${SIZE}" fill="url(#ground)"/>

  <g transform="translate(${offset} ${offset}) scale(${scale})" filter="url(#bloom)"
     fill="none" stroke="${SL_BLUE}" stroke-width="26"
     stroke-linecap="round" stroke-linejoin="round">

    <!-- Row 1: ticked -->
    <rect x="70" y="80" width="110" height="110" rx="22"/>
    <path d="M98 136 L122 160 L158 110" stroke="${SL_PALE}" stroke-width="24"/>
    <path d="M240 135 H490"/>

    <!-- Row 2: ticked -->
    <rect x="70" y="225" width="110" height="110" rx="22"/>
    <path d="M98 281 L122 305 L158 255" stroke="${SL_PALE}" stroke-width="24"/>
    <path d="M240 280 H440"/>

    <!-- Row 3: open -->
    <rect x="70" y="370" width="110" height="110" rx="22"/>
    <path d="M240 425 H470"/>
  </g>
</svg>`

const outDir = path.join('public', 'icons')
fs.mkdirSync(outDir, { recursive: true })

const master = Buffer.from(svg)
for (const size of [192, 512, 1024]) {
  await sharp(master, { density: 384 })
    .resize(size, size)
    .png()
    .toFile(path.join(outDir, `icon-${size}.png`))
}

// The vector master also lands in assets/, which is where @capacitor/assets
// reads from when generating the native launcher icons and splash screens
// (`npm run release:apk -- --icons`).
fs.mkdirSync('assets', { recursive: true })
fs.writeFileSync(path.join('assets', 'icon.svg'), svg)

console.log(`PWA + launcher icons written to ${outDir}/ (192, 512, 1024)`)
console.log('Vector master written to assets/icon.svg')
