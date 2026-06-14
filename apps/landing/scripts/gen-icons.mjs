// Generate the favicon / PWA raster set from public/icon.svg using ImageMagick
// (`magick`), a local dev tool. Run via `pnpm icons:generate`. Outputs are
// committed (cold clones ship them); not part of `pnpm regen`.
import { execFileSync } from 'node:child_process'

const SRC = 'public/icon.svg'
const png = (size, out) =>
  execFileSync('magick', [
    '-background',
    'none',
    '-density',
    '384',
    SRC,
    '-resize',
    `${size}x${size}`,
    out,
  ])

png(180, 'public/apple-touch-icon.png')
png(192, 'public/icon-192.png')
png(512, 'public/icon-512.png')

// favicon.ico = 16/32/48 multi-resolution, generated in one pass.
execFileSync('magick', [
  '-background',
  'none',
  '-density',
  '384',
  SRC,
  '-define',
  'icon:auto-resize=48,32,16',
  'public/favicon.ico',
])

console.log('wrote apple-touch-icon.png, icon-192.png, icon-512.png, favicon.ico')
