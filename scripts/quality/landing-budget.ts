/**
 * Landing performance budget — what a visitor to `/` actually downloads.
 *
 * This check measured the sum of EVERY `.js` and `.css` file in `apps/site/dist` — 111 JS
 * and 48 CSS files, because the site long ago stopped being a landing page and became a
 * full multi-route SPA (docs, component pages, playground, editor, flow, charts). The
 * landing never loads most of that. It reported 661 KB against a 135 KB budget and failed
 * on every clean tree, which is why it is not wired into CI: a check that always fails is a
 * check nobody reads. The real landing payload is ~130 KB and fits the budget it was given.
 *
 * So the budget is now measured the only way that cannot drift as routes are added: load
 * the built site in a real browser, scroll the whole page so every lazily-mounted section
 * actually fetches, and sum the gzipped bytes of the JS and CSS that came over the wire.
 * A new docs route cannot inflate this number; a heavier landing section can, which is what
 * a landing budget is for.
 *
 * Needs a prior `pnpm build` and Chromium. Run: `pnpm audit:landing`.
 */
import { spawn, type ChildProcess } from 'node:child_process'
import { existsSync, readdirSync } from 'node:fs'
import { join, extname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { gzipSync } from 'node:zlib'
import { chromium } from '@playwright/test'

const root = fileURLToPath(new URL('../..', import.meta.url))
const siteDir = join(root, 'apps/site')
const distDir = join(siteDir, 'dist')

// CascadeView (@cascivo/render) loads all cascade components for its runtime component map;
// tree-shaking cannot eliminate them. Budget raised from 120 to 135 KB to accommodate.
const JS_BUDGET_KB = 135
const CSS_BUDGET_KB = 60

/**
 * Sections that must exist on the rendered page before any number is believed.
 *
 * A byte floor is the wrong guard here: a 404 route still boots the SPA shell and pulled
 * 43 KB in testing, so any threshold low enough to be safe is too low to catch a broken
 * measurement, and any threshold high enough to catch one would fail a genuine
 * optimisation. Asserting the landing actually rendered is unambiguous, and it is what
 * makes a passing number mean something — the alternative is a check that reports a
 * triumphant 0 KB, which is a worse failure than the over-reporting this replaces.
 */
const REQUIRED_SECTIONS = ['#quickstart', '#showcase']

const PORT = 4390

if (!existsSync(distDir)) {
  console.error('landing-budget: no apps/site/dist — run `pnpm build` first.')
  process.exit(1)
}

function walkDir(dir: string): string[] {
  const files: string[] = []
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name)
    files.push(...(entry.isDirectory() ? walkDir(full) : [full]))
  }
  return files
}

/** Wait for the preview server to answer, or give up. */
async function waitForServer(url: string, tries = 60): Promise<void> {
  for (let i = 0; i < tries; i++) {
    try {
      const res = await fetch(url)
      if (res.ok) return
    } catch {
      // not up yet
    }
    await new Promise((r) => setTimeout(r, 500))
  }
  throw new Error(`landing-budget: preview server never came up at ${url}`)
}

let server: ChildProcess | undefined
let jsGzBytes = 0
let cssGzBytes = 0
const perFile = new Map<string, number>()

try {
  server = spawn('pnpm', ['exec', 'vite', 'preview', '--port', String(PORT), '--strictPort'], {
    cwd: siteDir,
    stdio: 'ignore',
  })
  await waitForServer(`http://localhost:${PORT}/`)

  const browser = await chromium.launch()
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } })

  // Bodies arrive asynchronously; collect the promises and settle them before summing, or
  // the totals depend on how fast the event loop drained.
  const pending: Promise<void>[] = []
  page.on('response', (res) => {
    const path = new URL(res.url()).pathname
    if (!/\.(js|mjs|css)$/.test(path)) return
    pending.push(
      res
        .body()
        .then((buf) => {
          perFile.set(path, gzipSync(buf).length)
        })
        .catch(() => {
          // A redirect or a body already discarded — not a budget signal.
        }),
    )
  })

  await page.goto(`http://localhost:${PORT}/`, { waitUntil: 'networkidle' })
  // The landing mounts its below-the-fold sections lazily. They are part of what a visitor
  // downloads, so scroll the page to completion before measuring.
  await page.evaluate(async () => {
    for (let y = 0; y < document.body.scrollHeight; y += 600) {
      window.scrollTo(0, y)
      await new Promise((r) => setTimeout(r, 60))
    }
  })
  await page.waitForLoadState('networkidle')

  const missing: string[] = []
  for (const sel of REQUIRED_SECTIONS) {
    if ((await page.$(sel)) === null) missing.push(sel)
  }

  await Promise.all(pending)
  await browser.close()

  if (missing.length > 0) {
    console.error(
      `landing-budget: the landing did not render — missing ${missing.join(', ')}. ` +
        'Any byte count from this run is meaningless, so this is a failure, not a pass.',
    )
    process.exit(1)
  }
} finally {
  server?.kill()
}

for (const [path, bytes] of perFile) {
  if (path.endsWith('.css')) cssGzBytes += bytes
  else jsGzBytes += bytes
}

// Fonts stay a dist-wide invariant: cascivo self-hosts none, and one appearing anywhere in
// the build is a regression regardless of which route pulls it.
let fontFiles = 0
for (const f of walkDir(distDir)) {
  if (['.woff', '.woff2', '.ttf', '.otf', '.eot'].includes(extname(f))) {
    fontFiles++
    console.error(`FAIL font in dist: ${f}`)
  }
}

const jsKb = jsGzBytes / 1024
const cssKb = cssGzBytes / 1024
const failures: string[] = []

console.log(`Landing JS gz:  ${jsKb.toFixed(1)} KB (budget ${JS_BUDGET_KB} KB)`)
console.log(`Landing CSS gz: ${cssKb.toFixed(1)} KB (budget ${CSS_BUDGET_KB} KB)`)
console.log(`Files over the wire: ${perFile.size}`)
console.log(`Font files in dist: ${fontFiles}`)

if (jsKb > JS_BUDGET_KB) failures.push(`JS ${jsKb.toFixed(1)} KB > ${JS_BUDGET_KB} KB budget`)
if (cssKb > CSS_BUDGET_KB) failures.push(`CSS ${cssKb.toFixed(1)} KB > ${CSS_BUDGET_KB} KB budget`)
if (fontFiles > 0) failures.push(`${fontFiles} font file(s) found in dist`)

if (failures.length > 0) {
  for (const f of failures) console.error(`FAIL ${f}`)
  console.error('\nLargest assets on the landing:')
  for (const [path, bytes] of [...perFile].sort((a, b) => b[1] - a[1]).slice(0, 10)) {
    console.error(`  ${(bytes / 1024).toFixed(1).padStart(7)} KB  ${path}`)
  }
  process.exit(1)
}

console.log('landing budget OK')
