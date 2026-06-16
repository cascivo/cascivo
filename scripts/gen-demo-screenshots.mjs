// Generate the showcase screenshots used by the /examples hub + detail pages
// (roadmap v22 T4). Output: apps/landing/public/screenshots/<slug>/<theme>-<viewport>.png
//
// Two modes:
//   --capture     real Playwright screenshots of each live demo (needs Chromium:
//                 `pnpm exec playwright install chromium`). The high-fidelity path.
//   (default)     deterministic pure-Node placeholder wireframes — no browser.
//                 Used in environments without Chromium so the marketing pages
//                 never show broken images; replace with --capture where a
//                 browser is available.
//
// Like public/og.png, these are committed binary assets and are NOT part of
// `pnpm regen`/the drift gate (rasterized output is not byte-identical across
// machines — see apps/landing/scripts/gen-og.mjs).
//
// Usage:
//   node scripts/gen-demo-screenshots.mjs            # placeholders
//   node scripts/gen-demo-screenshots.mjs --capture  # real screenshots

import { deflateSync } from 'node:zlib'
import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const here = dirname(fileURLToPath(import.meta.url))
const root = resolve(here, '..')
const OUT_ROOT = resolve(root, 'apps/landing/public/screenshots')

/** slug → { accent, storageThemeKey } */
const DEMOS = {
  deploy: { accent: [0, 112, 243], themeKey: 'deploy.theme' },
  pay: { accent: [99, 91, 255], themeKey: 'pay.theme' },
  flow: { accent: [252, 93, 39], themeKey: 'flow.theme' },
  track: { accent: [94, 106, 210], themeKey: 'track.theme' },
  pulse: { accent: [99, 44, 166], themeKey: 'pulse.theme' },
}

const VIEWPORTS = {
  desktop: { w: 1280, h: 800, scale: 0.625 }, // placeholder rendered at 800×500
  mobile: { w: 390, h: 844, scale: 0.72 }, // placeholder rendered at 281×608
}

const THEMES = ['light', 'dark']

// ── Pure-Node PNG encoder (RGBA, no deps) ─────────────────────────────────
const CRC_TABLE = (() => {
  const t = new Int32Array(256)
  for (let n = 0; n < 256; n++) {
    let c = n
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
    t[n] = c
  }
  return t
})()

function crc32(buf) {
  let c = ~0
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8)
  return ~c >>> 0
}

function chunk(type, data) {
  const len = Buffer.alloc(4)
  len.writeUInt32BE(data.length, 0)
  const typeBuf = Buffer.from(type, 'ascii')
  const crc = Buffer.alloc(4)
  crc.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])), 0)
  return Buffer.concat([len, typeBuf, data, crc])
}

/** Encode RGBA pixel data (Uint8Array, w*h*4) to a PNG buffer. */
function encodePng(width, height, rgba) {
  const sig = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])
  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(width, 0)
  ihdr.writeUInt32BE(height, 4)
  ihdr[8] = 8 // bit depth
  ihdr[9] = 6 // color type RGBA
  // 10,11,12 = compression/filter/interlace = 0
  const stride = width * 4
  const raw = Buffer.alloc((stride + 1) * height)
  for (let y = 0; y < height; y++) {
    raw[y * (stride + 1)] = 0 // filter: none
    rgba.subarray(y * stride, y * stride + stride).copy?.(raw, y * (stride + 1) + 1)
    if (!rgba.subarray(y * stride, y * stride + stride).copy) {
      raw.set(rgba.subarray(y * stride, y * stride + stride), y * (stride + 1) + 1)
    }
  }
  const idat = deflateSync(raw, { level: 9 })
  return Buffer.concat([
    sig,
    chunk('IHDR', ihdr),
    chunk('IDAT', idat),
    chunk('IEND', Buffer.alloc(0)),
  ])
}

// ── Placeholder wireframe ──────────────────────────────────────────────────
const PALETTE = {
  light: {
    bg: [247, 248, 250],
    surface: [255, 255, 255],
    border: [226, 228, 233],
    muted: [222, 226, 232],
  },
  dark: { bg: [11, 12, 14], surface: [22, 24, 29], border: [40, 43, 51], muted: [46, 50, 59] },
}

function placeholderRgba(width, height, theme, accent) {
  const p = PALETTE[theme]
  const data = new Uint8Array(width * height * 4)
  const headerH = Math.round(height * 0.1)
  const sidebarW = Math.round(width * 0.2)
  const pad = Math.round(Math.min(width, height) * 0.04)

  const set = (x, y, [r, g, b]) => {
    const i = (y * width + x) * 4
    data[i] = r
    data[i + 1] = g
    data[i + 2] = b
    data[i + 3] = 255
  }

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      let c = p.bg
      if (y < headerH) c = accent
      else if (x < sidebarW) c = p.surface
      set(x, y, c)
    }
  }

  // Content "cards": a 2×2 grid of surface rectangles in the content area.
  const cx0 = sidebarW + pad
  const cy0 = headerH + pad
  const gw = width - cx0 - pad
  const gh = height - cy0 - pad
  const cardW = Math.round((gw - pad) / 2)
  const cardH = Math.round((gh - pad) / 2)
  const cards = [
    [cx0, cy0],
    [cx0 + cardW + pad, cy0],
    [cx0, cy0 + cardH + pad],
    [cx0 + cardW + pad, cy0 + cardH + pad],
  ]
  for (const [bx, by] of cards) {
    for (let y = by; y < Math.min(by + cardH, height); y++) {
      for (let x = bx; x < Math.min(bx + cardW, width); x++) {
        const edge = x < bx + 2 || y < by + 2 || x > bx + cardW - 3 || y > by + cardH - 3
        set(x, y, edge ? p.border : p.surface)
        // a thin accent bar near the top of each card
        if (y > by + 6 && y < by + 10 && x > bx + 8 && x < bx + Math.round(cardW * 0.4))
          set(x, y, accent)
        // muted "rows"
        if (y > by + 18 && (y - by) % 10 < 3 && x > bx + 8 && x < bx + cardW - 8) set(x, y, p.muted)
      }
    }
  }
  return data
}

function writePlaceholders() {
  for (const [slug, { accent }] of Object.entries(DEMOS)) {
    const dir = resolve(OUT_ROOT, slug)
    mkdirSync(dir, { recursive: true })
    for (const theme of THEMES) {
      for (const [vp, { w, h, scale }] of Object.entries(VIEWPORTS)) {
        const width = Math.round(w * scale)
        const height = Math.round(h * scale)
        const png = encodePng(width, height, placeholderRgba(width, height, theme, accent))
        writeFileSync(resolve(dir, `${theme}-${vp}.png`), png)
      }
    }
    console.log(`[screenshots] ${slug}: 4 placeholder PNGs`)
  }
  console.log(
    '[screenshots] placeholder wireframes written — run with --capture for real screenshots.',
  )
}

// ── Real capture (Playwright) ───────────────────────────────────────────────
async function capture() {
  const { chromium } = await import('@playwright/test')
  const { spawn, execFileSync } = await import('node:child_process')
  const { existsSync } = await import('node:fs')

  const landingDist = resolve(root, 'apps/landing/dist')
  if (!existsSync(landingDist)) {
    throw new Error(
      'Landing is not built. Run `pnpm build:landing-demos` from the repo root first.',
    )
  }

  // Copy each demo's built dist into landing/dist/demos/<slug>/ so the preview
  // server can serve them. assemble-demos.mjs does the copy (no --build flag
  // since example apps are expected to already be built).
  console.log('[screenshots] assembling demo apps into landing dist…')
  execFileSync('node', [resolve(root, 'scripts/assemble-demos.mjs')], {
    cwd: root,
    stdio: 'inherit',
  })

  const PORT = Number(process.env.SHOT_PORT ?? 4190)
  // Serve the assembled landing dist so /demos/<slug>/ is live.
  const server = spawn('pnpm', ['exec', 'vp', 'preview', '--port', String(PORT), '--strictPort'], {
    cwd: resolve(root, 'apps/landing'),
    stdio: 'ignore',
  })
  await new Promise((r) => setTimeout(r, 4000))

  const browser = await chromium.launch()
  try {
    for (const [slug, { themeKey }] of Object.entries(DEMOS)) {
      const dir = resolve(OUT_ROOT, slug)
      mkdirSync(dir, { recursive: true })
      for (const theme of THEMES) {
        for (const [vp, { w, h }] of Object.entries(VIEWPORTS)) {
          const ctx = await browser.newContext({
            viewport: { width: w, height: h },
            reducedMotion: 'reduce',
            // Seed the demo's persisted theme before first paint.
            storageState: {
              cookies: [],
              origins: [
                {
                  origin: `http://localhost:${PORT}`,
                  localStorage: [{ name: themeKey, value: JSON.stringify(theme) }],
                },
              ],
            },
          })
          const page = await ctx.newPage()
          await page.goto(`http://localhost:${PORT}/demos/${slug}/`, { waitUntil: 'networkidle' })
          await page.waitForTimeout(1200) // let seeded data settle (sim paused via reduced-motion)
          await page.screenshot({ path: resolve(dir, `${theme}-${vp}.png`) })
          await ctx.close()
        }
      }
      console.log(`[screenshots] ${slug}: 4 real screenshots`)
    }
  } finally {
    await browser.close()
    server.kill()
  }
}

// ── Block screenshots ──────────────────────────────────────────────────────
const BLOCK_NAMES = [
  'app-shell',
  'auth-login',
  'auth-signup',
  'dashboard-overview',
  'dashboard-table',
  'marketing-features',
  'marketing-hero',
  'settings-profile',
]

const BLOCKS_OUT_ROOT = resolve(root, 'apps/landing/public/blocks/screenshots')

// Called from T5 once /blocks/preview/:name route exists in the landing app.
// Placeholder — implementation goes here when preview route is available.
async function captureBlocks() {}

const mode = process.argv.includes('--capture') ? 'capture' : 'placeholder'
if (mode === 'capture') {
  try {
    await capture()
  } catch (err) {
    console.error('[screenshots] --capture failed:', err.message.split('\n')[0])
    console.error('[screenshots] falling back to placeholders. Install Chromium with:')
    console.error('  pnpm exec playwright install chromium')
    writePlaceholders()
  }
} else {
  writePlaceholders()
}
