/**
 * React vs htmx + Solid: the same app (`apps/examples/track-lite` and `track-lite-htmx`) measured
 * the same way. Writes a Markdown report to stdout (and JSON with `--json <file>`).
 *
 *     pnpm compare:react-vs-htmx            # builds both, 5 runs per app
 *     RUNS=9 pnpm compare:react-vs-htmx --json /tmp/compare.json
 *
 * Measured: shipped JS/CSS/HTML (raw + gzip -9, computed here from the response bodies, so the
 * number does not depend on the server's compression), request count, FCP and LCP
 * (PerformanceObserver), "ready" (navigation start until a click on "New issue" shows the dialog,
 * which needs the page's JS: hydration for React, the elements for htmx), bytes on the wire for
 * one mutation, LOC and dependency counts. CPU is throttled 4x so script cost is visible on a
 * fast machine. Numbers are for comparing the two stacks on one machine, not absolute figures.
 */
import { type ChildProcess, execFileSync, spawn } from 'node:child_process'
import { existsSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs'
import { createServer, type Server } from 'node:http'
import { extname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { gzipSync } from 'node:zlib'
import { chromium, type Browser } from '@playwright/test'

const ROOT = fileURLToPath(new URL('../../', import.meta.url))
const REACT = join(ROOT, 'apps/examples/track-lite')
const HTMX = join(ROOT, 'apps/examples/track-lite-htmx')
const RUNS = Number(process.env['RUNS'] ?? 5)
const CPU = Number(process.env['CPU_THROTTLE'] ?? 4)

const run = (cmd: string, args: string[], cwd = ROOT) =>
  execFileSync(cmd, args, { cwd, stdio: ['ignore', 'pipe', 'inherit'], encoding: 'utf8' })

function build(): string {
  run('pnpm', ['exec', 'vp', 'build'], REACT)
  run('pnpm', ['exec', 'vp', 'build'], HTMX)
  run('cargo', ['build', '--release', '-p', 'track-lite-htmx-server'])
  return join(ROOT, 'target/release/track-lite-htmx-server')
}

const TYPES: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
}

/** The React build as any static host serves it: files from `dist`, `index.html` for `/`. */
function serveStatic(dir: string, port: number): Promise<Server> {
  const server = createServer((req, res) => {
    const path = new URL(req.url ?? '/', 'http://x').pathname
    const file = join(dir, path === '/' ? 'index.html' : path)
    if (!file.startsWith(dir) || !existsSync(file) || statSync(file).isDirectory()) {
      res.writeHead(404).end()
      return
    }
    res.writeHead(200, { 'content-type': TYPES[extname(file)] ?? 'application/octet-stream' })
    res.end(readFileSync(file))
  })
  return new Promise((ok) => server.listen(port, '127.0.0.1', () => ok(server)))
}

async function startHtmx(bin: string, port: number): Promise<ChildProcess> {
  const child = spawn(bin, [], {
    cwd: ROOT,
    env: {
      ...process.env,
      ADDR: `127.0.0.1:${port}`,
      ASSETS_DIR: join(HTMX, 'dist'),
      TEAMMATE_MS: '0',
    },
    stdio: 'ignore',
  })
  for (let i = 0; i < 100; i++) {
    try {
      if ((await fetch(`http://127.0.0.1:${port}/`)).ok) return child
    } catch {
      // not listening yet
    }
    await new Promise((r) => setTimeout(r, 100))
  }
  child.kill()
  throw new Error('track-lite-htmx-server did not start')
}

interface Bytes {
  raw: number
  gz: number
}
interface Load {
  js: Bytes
  css: Bytes
  html: Bytes
  requests: number
  fcp: number
  lcp: number
  ready: number
  /** gzip bytes per script file, so the third-party engines (React, htmx) stand out. */
  scripts: Record<string, number>
}

const add = (a: Bytes, body: Buffer): Bytes => ({
  raw: a.raw + body.length,
  gz: a.gz + gzipSync(body, { level: 9 }).length,
})
const zero = (): Bytes => ({ raw: 0, gz: 0 })

async function load(browser: Browser, url: string): Promise<Load> {
  const context = await browser.newContext()
  const page = await context.newPage()
  const cdp = await context.newCDPSession(page)
  await cdp.send('Emulation.setCPUThrottlingRate', { rate: CPU })
  const out: Load = {
    js: zero(),
    css: zero(),
    html: zero(),
    requests: 0,
    fcp: 0,
    lcp: 0,
    ready: 0,
    scripts: {},
  }
  const pending: Promise<void>[] = []
  page.on('response', (res) => {
    // The SSE stream never ends; it is a request, not bytes of the page.
    if (res.url().endsWith('/events')) {
      out.requests++
      return
    }
    pending.push(
      res
        .body()
        .then((body) => {
          out.requests++
          const type = res.request().resourceType()
          if (type === 'script') {
            out.js = add(out.js, body)
            const name = new URL(res.url()).pathname.split('/').pop() ?? '?'
            out.scripts[name] = gzipSync(body, { level: 9 }).length
          } else if (type === 'stylesheet') out.css = add(out.css, body)
          else if (type === 'document') out.html = add(out.html, body)
        })
        .catch(() => undefined),
    )
  })
  await page.addInitScript(() => {
    const w = window as unknown as { __lcp: number }
    w.__lcp = 0
    new PerformanceObserver((list) => {
      for (const e of list.getEntries()) w.__lcp = e.startTime
    }).observe({ type: 'largest-contentful-paint', buffered: true })
  })
  await page.goto(url, { waitUntil: 'commit' })
  // "Ready": the first click on "New issue" that opens the dialog, retried until the JS that
  // handles it has run. Measured from navigation start, like TTI.
  const button = page.getByRole('button', { name: 'New issue' })
  const dialog = page.getByRole('dialog')
  for (;;) {
    await button.click()
    if (await dialog.isVisible()) break
    await page.waitForTimeout(10)
  }
  out.ready = await page.evaluate(() => performance.now())
  await page.keyboard.press('Escape')
  await page.waitForLoadState('networkidle').catch(() => undefined)
  await Promise.all(pending)
  const paint = await page.evaluate(() => ({
    fcp: performance.getEntriesByName('first-contentful-paint')[0]?.startTime ?? 0,
    lcp: (window as unknown as { __lcp: number }).__lcp,
  }))
  out.fcp = paint.fcp
  out.lcp = paint.lcp
  await context.close()
  return out
}

/** Bytes both ways for one "Advance" click (React: none, it is client state). */
async function mutationBytes(browser: Browser, url: string): Promise<Bytes & { requests: number }> {
  const context = await browser.newContext()
  const page = await context.newPage()
  await page.goto(url, { waitUntil: 'networkidle' }).catch(() => undefined)
  await page.getByRole('button', { name: 'New issue' }).waitFor()
  const r = { raw: 0, gz: 0, requests: 0 }
  const pending: Promise<void>[] = []
  page.on('response', (res) => {
    if (res.url().endsWith('/events')) return
    r.requests++
    pending.push(
      res
        .body()
        .then((b) => {
          r.raw += b.length
          r.gz += gzipSync(b, { level: 9 }).length
        })
        .catch(() => undefined),
    )
  })
  await page.getByRole('button', { name: 'Advance Write onboarding docs' }).click()
  await page.getByText('Todo').first().waitFor()
  await page.waitForTimeout(300)
  await Promise.all(pending)
  await context.close()
  return r
}

const median = (xs: number[]) => {
  const s = [...xs].sort((a, b) => a - b)
  return s[Math.floor(s.length / 2)] ?? 0
}

function loc(dirs: string[], exts: string[]): number {
  let n = 0
  const walk = (d: string) => {
    for (const e of readdirSync(d, { withFileTypes: true })) {
      const p = join(d, e.name)
      if (e.isDirectory()) walk(p)
      else if (exts.includes(extname(e.name)))
        n += readFileSync(p, 'utf8')
          .split('\n')
          .filter((l) => l.trim() !== '').length
    }
  }
  for (const d of dirs) walk(d)
  return n
}

function npmDeps(dir: string): { direct: number; installed: number } {
  const pkg = JSON.parse(readFileSync(join(dir, 'package.json'), 'utf8')) as {
    dependencies?: Record<string, string>
  }
  const direct = Object.keys(pkg.dependencies ?? {}).length
  // Production closure, workspace packages included (they ship code to the page too).
  const name = (JSON.parse(readFileSync(join(dir, 'package.json'), 'utf8')) as { name: string })
    .name
  const tree = run('pnpm', [
    '--filter',
    name,
    'list',
    '--prod',
    '--depth',
    'Infinity',
    '--parseable',
  ])
  const installed = new Set(tree.split('\n').filter(Boolean)).size - 1
  return { direct, installed }
}

function cargoDeps(): { direct: number; installed: number } {
  const toml = readFileSync(join(HTMX, 'server/Cargo.toml'), 'utf8')
  const section = toml.split('[dependencies]')[1]?.split('\n[')[0] ?? ''
  const direct = section.split('\n').filter((l) => /^[a-z0-9_-]+\s*=/.test(l)).length
  const tree = run('cargo', [
    'tree',
    '-p',
    'track-lite-htmx-server',
    '-e',
    'normal',
    '--prefix',
    'none',
    '--no-dedupe',
  ])
  const installed = new Set(
    tree
      .split('\n')
      .map((l) => l.split(' (')[0]?.trim())
      .filter(Boolean),
  ).size
  return { direct, installed: installed - 1 }
}

const kb = (b: Bytes) => `${(b.raw / 1024).toFixed(1)} KB / ${(b.gz / 1024).toFixed(1)} KB`
const files = (m: Record<string, number>) =>
  Object.entries(m)
    .map(([k, v]) => `${k} ${(v / 1024).toFixed(1)}`)
    .join(', ')
const ms = (n: number) => `${Math.round(n)} ms`

async function main() {
  const jsonAt = process.argv.indexOf('--json')
  const bin = process.env['SKIP_BUILD']
    ? join(ROOT, 'target/release/track-lite-htmx-server')
    : build()
  const staticServer = await serveStatic(join(REACT, 'dist'), 4191)
  const htmx = await startHtmx(bin, 4192)
  // Chromium is preinstalled in CI images and the dev container; fall back to its fixed path.
  const browser = await chromium
    .launch()
    .catch(() => chromium.launch({ executablePath: '/opt/pw-browsers/chromium' }))
  try {
    const apps = { react: 'http://127.0.0.1:4191/', htmx: 'http://127.0.0.1:4192/' } as const
    const result: Record<string, unknown> = {}
    for (const [name, url] of Object.entries(apps)) {
      await load(browser, url) // warm-up: OS caches, the server's first render
      const runs: Load[] = []
      for (let i = 0; i < RUNS; i++) runs.push(await load(browser, url))
      const first = runs[0]
      if (!first) throw new Error('no runs')
      result[name] = {
        js: first.js,
        css: first.css,
        html: first.html,
        requests: first.requests,
        scripts: first.scripts,
        fcp: median(runs.map((r) => r.fcp)),
        lcp: median(runs.map((r) => r.lcp)),
        ready: median(runs.map((r) => r.ready)),
        mutation: await mutationBytes(browser, url),
      }
    }
    result['loc'] = {
      react: loc([join(REACT, 'src')], ['.ts', '.tsx', '.css']),
      htmx: loc(
        [join(HTMX, 'src'), join(HTMX, 'server/src'), join(HTMX, 'server/templates')],
        ['.ts', '.tsx', '.css', '.rs', '.html'],
      ),
      reactTests: loc([join(REACT, 'test')], ['.tsx']),
      htmxTests: loc([join(HTMX, 'server/tests')], ['.rs']),
    }
    result['deps'] = { react: npmDeps(REACT), htmxNpm: npmDeps(HTMX), htmxCargo: cargoDeps() }
    if (jsonAt > 0 && process.argv[jsonAt + 1])
      writeFileSync(process.argv[jsonAt + 1] as string, JSON.stringify(result, null, 2))
    report(result as unknown as Report)
  } finally {
    await browser.close()
    htmx.kill()
    staticServer.close()
  }
}

interface AppResult extends Omit<Load, never> {
  mutation: Bytes & { requests: number }
}
interface Report {
  react: AppResult
  htmx: AppResult
  loc: { react: number; htmx: number; reactTests: number; htmxTests: number }
  deps: Record<'react' | 'htmxNpm' | 'htmxCargo', { direct: number; installed: number }>
}

function report(r: Report) {
  const row = (label: string, a: string, b: string) => `| ${label} | ${a} | ${b} |`
  const lines = [
    `CPU throttle ${CPU}x, median of ${RUNS} runs, Chromium headless, localhost.`,
    '',
    '| Metric | React (track-lite) | htmx + Solid (track-lite-htmx) |',
    '| ------ | ------------------ | ------------------------------ |',
    row('JS (raw / gzip)', kb(r.react.js), kb(r.htmx.js)),
    row('JS files (gzip)', files(r.react.scripts), files(r.htmx.scripts)),
    row('CSS (raw / gzip)', kb(r.react.css), kb(r.htmx.css)),
    row('HTML (raw / gzip)', kb(r.react.html), kb(r.htmx.html)),
    row('Requests on load', String(r.react.requests), String(r.htmx.requests)),
    row('FCP', ms(r.react.fcp), ms(r.htmx.fcp)),
    row('LCP', ms(r.react.lcp), ms(r.htmx.lcp)),
    row('Ready (first working click)', ms(r.react.ready), ms(r.htmx.ready)),
    row(
      'One "Advance" click on the wire',
      `${r.react.mutation.requests} req, ${kb(r.react.mutation)}`,
      `${r.htmx.mutation.requests} req, ${kb(r.htmx.mutation)}`,
    ),
    row('App LOC (non-blank)', String(r.loc.react), String(r.loc.htmx)),
    row('Test LOC', String(r.loc.reactTests), String(r.loc.htmxTests)),
    row(
      'Dependencies (direct / installed closure)',
      `npm ${r.deps.react.direct} / ${r.deps.react.installed}`,
      `npm ${r.deps.htmxNpm.direct} / ${r.deps.htmxNpm.installed}, cargo ${r.deps.htmxCargo.direct} / ${r.deps.htmxCargo.installed}`,
    ),
  ]
  process.stdout.write(`${lines.join('\n')}\n`)
}

await main()
