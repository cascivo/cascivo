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
 * So the budget is measured the only way that cannot drift as routes are added: load the
 * built site in a real browser and sum the gzipped bytes of the JS and CSS that came over
 * the wire. A new docs route cannot inflate that number.
 *
 * TWO numbers, and only one of them gates:
 *
 *   - INITIAL — everything fetched to render the page, before any scrolling. This is the
 *     budget. It is what decides how fast the landing becomes usable, and it is the only
 *     figure a visitor who bounces ever pays.
 *   - TOTAL — initial plus every chunk that arrives as you scroll to the bottom. Reported,
 *     not gated: a section held back until it nears the viewport genuinely does not cost
 *     what an eagerly-loaded one costs, and charging it the same rate would price in a
 *     visitor who may never scroll that far.
 *
 * The two were identical until the gallery was put behind an IntersectionObserver, because
 * `lazy()` alone defers nothing when every section renders on mount. Gating TOTAL would
 * have reported that change as worth 0 KB, which is how a budget ends up discouraging the
 * optimisation it exists to encourage.
 *
 * Needs a prior `pnpm build` and Chromium. Run: `pnpm audit:landing`.
 */
import { createServer, type Server } from 'node:http'
import type { AddressInfo } from 'node:net'
import { createReadStream, existsSync, readdirSync, statSync } from 'node:fs'
import { join, extname, normalize } from 'node:path'
import { fileURLToPath } from 'node:url'
import { gzipSync } from 'node:zlib'
import { chromium } from '@playwright/test'

const root = fileURLToPath(new URL('../..', import.meta.url))
const distDir = join(root, 'apps/site/dist')

// CascivoView (@cascivo/render) loads all cascade components for its runtime component map;
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

const CONTENT_TYPES: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  // Module scripts are refused outright under any other type, which would leave the page
  // blank and the byte count meaningless.
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.woff2': 'font/woff2',
  '.ico': 'image/x-icon',
}

/**
 * Serve `dist/` from this process, rather than spawning `vite preview`.
 *
 * The spawned form failed on CI: apps/site does not depend on `vite` (it depends on
 * `vite-plus`), so `pnpm exec vite` resolves only through a hoisted root bin — present
 * locally, absent under CI's strict pnpm layout. The server never came up, and because the
 * spawn used `stdio: 'ignore'` the real reason was swallowed entirely.
 *
 * Serving the directory here needs no package manager, no bin resolution and no port race,
 * and a static file server is all `vite preview` was ever providing for this check.
 */
function serveDist(): Promise<Server> {
  const server = createServer((req, res) => {
    const urlPath = new URL(req.url ?? '/', 'http://localhost').pathname
    const rel = urlPath === '/' ? 'index.html' : normalize(urlPath).replace(/^(\.\.[/\\])+/, '')
    const file = join(distDir, rel)
    if (!file.startsWith(distDir) || !existsSync(file) || !statSync(file).isFile()) {
      res.writeHead(404).end()
      return
    }
    const type = CONTENT_TYPES[extname(file)] ?? 'application/octet-stream'
    res.writeHead(200, { 'content-type': type })
    createReadStream(file).pipe(res)
  })
  // Port 0: the OS assigns a free one. A fixed port makes the check die with EADDRINUSE
  // whenever anything else happens to hold it, which is a failure mode the check should not
  // have at all.
  return new Promise((resolve, reject) => {
    server.on('error', reject)
    server.listen(0, '127.0.0.1', () => resolve(server))
  })
}

let server: Server | undefined
const perFile = new Map<string, number>()
/** Paths already fetched when the page had rendered but nothing had been scrolled. */
let initialPaths = new Set<string>()

try {
  server = await serveDist()
  const origin = `http://127.0.0.1:${(server.address() as AddressInfo).port}`

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

  await page.goto(`${origin}/`, { waitUntil: 'networkidle' })
  // Snapshot before scrolling: this set IS the budget. Settle the bodies first, or which
  // requests counted would depend on how fast the event loop drained.
  await Promise.all(pending)
  initialPaths = new Set(perFile.keys())

  // Then scroll to the bottom so intersection-gated sections fetch too, for the TOTAL line.
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
  server?.close()
}

function totals(paths: Iterable<string>): { js: number; css: number; files: number } {
  let js = 0
  let css = 0
  let files = 0
  for (const path of paths) {
    const bytes = perFile.get(path) ?? 0
    if (path.endsWith('.css')) css += bytes
    else js += bytes
    files++
  }
  return { js, css, files }
}

const initial = totals(initialPaths)
const total = totals(perFile.keys())

// Fonts stay a dist-wide invariant: cascivo self-hosts none, and one appearing anywhere in
// the build is a regression regardless of which route pulls it.
let fontFiles = 0
for (const f of walkDir(distDir)) {
  if (['.woff', '.woff2', '.ttf', '.otf', '.eot'].includes(extname(f))) {
    fontFiles++
    console.error(`FAIL font in dist: ${f}`)
  }
}

const jsKb = initial.js / 1024
const cssKb = initial.css / 1024
const failures: string[] = []

const kb = (bytes: number): string => (bytes / 1024).toFixed(1).padStart(6)
console.log(
  `INITIAL (budgeted)  JS ${kb(initial.js)} KB / ${JS_BUDGET_KB}   ` +
    `CSS ${kb(initial.css)} KB / ${CSS_BUDGET_KB}   (${initial.files} files)`,
)
console.log(
  `TOTAL   (reported)  JS ${kb(total.js)} KB         ` +
    `CSS ${kb(total.css)} KB         (${total.files} files, after scrolling to the bottom)`,
)
console.log(`Font files in dist: ${fontFiles}`)

if (jsKb > JS_BUDGET_KB) failures.push(`JS ${jsKb.toFixed(1)} KB > ${JS_BUDGET_KB} KB budget`)
if (cssKb > CSS_BUDGET_KB) failures.push(`CSS ${cssKb.toFixed(1)} KB > ${CSS_BUDGET_KB} KB budget`)
if (fontFiles > 0) failures.push(`${fontFiles} font file(s) found in dist`)

if (failures.length > 0) {
  for (const f of failures) console.error(`FAIL ${f}`)
  console.error('\nLargest assets in the INITIAL payload:')
  const initialSorted = [...initialPaths]
    .map((path) => [path, perFile.get(path) ?? 0] as const)
    .sort((a, b) => b[1] - a[1])
  for (const [path, bytes] of initialSorted.slice(0, 10)) {
    console.error(`  ${(bytes / 1024).toFixed(1).padStart(7)} KB  ${path}`)
  }
  console.error(
    '\nA section that is far below the fold can be held back with WhenNearViewport in\n' +
      'apps/site/src/marketing/App.tsx, which moves its chunk out of this payload.',
  )
  process.exit(1)
}

console.log('landing budget OK')
