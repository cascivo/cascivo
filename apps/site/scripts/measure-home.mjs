// Measure the home page ("/") of a running server: JS/CSS bytes (raw + gzip, initial and after a
// full scroll), LCP, and full-page screenshots per viewport and theme. Used by the W4 landing pilot
// (docs/plans/rust-html-stack-results-w4.md) to compare the Preact SPA home with the cascivo-web one.
//
//   node apps/site/scripts/measure-home.mjs <base-url> <out-dir>
//
// HOME_HTML=<file> serves that file for "/" instead (e.g. the SPA's own dist/index.html saved
// before `build:web` replaced it), so both versions are measured against one server.
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { gzipSync } from 'node:zlib'
import { chromium } from '@playwright/test'

const [base = 'http://127.0.0.1:4173', outDir = 'measure-out'] = process.argv.slice(2)
mkdirSync(outDir, { recursive: true })

const VIEWPORTS = { desktop: { width: 1280, height: 800 }, mobile: { width: 390, height: 844 } }
const THEMES = ['poster', 'poster-dark']

async function settle(page) {
  // Walk the page so lazy sections mount, then return to the top.
  const height = await page.evaluate(() => document.documentElement.scrollHeight)
  for (let y = 0; y < height; y += 600) {
    await page.evaluate((top) => window.scrollTo(0, top), y)
    await page.waitForTimeout(60)
  }
  await page.waitForLoadState('networkidle')
  await page.evaluate(() => window.scrollTo(0, 0))
  await page.waitForTimeout(300)
}

const browser = await chromium.launch(
  process.env.PW_CHROMIUM ? { executablePath: process.env.PW_CHROMIUM } : {},
)
const result = { base, runs: [] }
for (const [vpName, viewport] of Object.entries(VIEWPORTS)) {
  for (const theme of THEMES) {
    const ctx = await browser.newContext({
      viewport,
      reducedMotion: 'reduce',
      deviceScaleFactor: 1,
    })
    await ctx.addInitScript((t) => {
      localStorage.setItem('cascade-theme', JSON.stringify({ v: 1, value: t }))
    }, theme)
    const page = await ctx.newPage()
    if (process.env.THROTTLE) {
      // Lighthouse-like mobile conditions: 150 ms RTT, 1.6 Mbps down, 4x CPU slowdown.
      const cdp = await ctx.newCDPSession(page)
      await cdp.send('Network.enable')
      await cdp.send('Network.emulateNetworkConditions', {
        offline: false,
        latency: 150,
        downloadThroughput: (1.6 * 1024 * 1024) / 8,
        uploadThroughput: (750 * 1024) / 8,
      })
      await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 })
    }
    if (process.env.HOME_HTML) {
      const html = readFileSync(process.env.HOME_HTML, 'utf8')
      await page.route(base + '/', (r) => r.fulfill({ body: html, contentType: 'text/html' }))
    }
    await page.goto(base + '/', { waitUntil: 'networkidle' })
    const lcp = await page.evaluate(
      () =>
        new Promise((resolve) => {
          new PerformanceObserver((list) => {
            const e = list.getEntries().at(-1)
            resolve(e ? Math.round(e.startTime) : null)
          }).observe({ type: 'largest-contentful-paint', buffered: true })
          setTimeout(() => resolve(null), 10000)
        }),
    )
    const scrollStart = await page.evaluate(() => performance.now())
    await settle(page)
    // Resource Timing sees every script/stylesheet, cached or preloaded; sizes come from
    // refetching each URL (the preview server does not compress, so gzip is computed here).
    const entries = await page.evaluate(() =>
      performance
        .getEntriesByType('resource')
        .filter((e) => e.initiatorType === 'script' || e.initiatorType === 'link' || e.name.endsWith('.js') || e.name.endsWith('.css'))
        .map((e) => ({ url: e.name, start: e.startTime })),
    )
    const bytes = new Map()
    for (const e of entries) {
      const type = e.url.endsWith('.css') ? 'stylesheet' : e.url.endsWith('.js') ? 'script' : null
      if (!type || bytes.has(e.url)) continue
      const body = Buffer.from(await (await fetch(e.url)).arrayBuffer())
      bytes.set(e.url, {
        type,
        phase: e.start < scrollStart ? 'initial' : 'scrolled',
        raw: body.length,
        gz: gzipSync(body).length,
      })
    }
    const sum = (filter) =>
      [...bytes.values()]
        .filter(filter)
        .reduce((a, b) => ({ raw: a.raw + b.raw, gz: a.gz + b.gz, n: a.n + 1 }), {
          raw: 0,
          gz: 0,
          n: 0,
        })
    const run = {
      viewport: vpName,
      theme,
      lcpMs: lcp,
      jsInitial: sum((b) => b.type === 'script' && b.phase === 'initial'),
      jsTotal: sum((b) => b.type === 'script'),
      cssInitial: sum((b) => b.type === 'stylesheet' && b.phase === 'initial'),
      cssTotal: sum((b) => b.type === 'stylesheet'),
      // The document itself: inline scripts (theme, island loader) and static markup live here.
      html: await (async () => {
        const body = Buffer.from(await page.content())
        return { raw: body.length, gz: gzipSync(body).length }
      })(),
      height: await page.evaluate(() => document.documentElement.scrollHeight),
    }
    await page.screenshot({
      path: join(outDir, `home-${vpName}-${theme}.png`),
      fullPage: true,
      animations: 'disabled',
    })
    result.runs.push(run)
    await ctx.close()
  }
}
await browser.close()
writeFileSync(join(outDir, 'measure.json'), JSON.stringify(result, null, 2))
console.log(JSON.stringify(result.runs, null, 1))
