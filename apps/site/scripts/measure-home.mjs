// Measure the home page ("/") of a running server: JS/CSS bytes (raw + gzip, initial and after a
// full scroll), LCP, and full-page screenshots per viewport and theme. Used by the W4 landing pilot
// (docs/plans/rust-html-stack-results-w4.md) to compare the Preact SPA home with the cascivo-web one.
//
//   node apps/site/scripts/measure-home.mjs <base-url> <out-dir>
import { mkdirSync, writeFileSync } from 'node:fs'
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
    const bytes = new Map()
    let phase = 'initial'
    page.on('response', async (res) => {
      const type = res.request().resourceType()
      if (type !== 'script' && type !== 'stylesheet') return
      try {
        const body = await res.body()
        bytes.set(res.url(), { type, phase, raw: body.length, gz: gzipSync(body).length })
      } catch {}
    })
    await page.goto(base + '/', { waitUntil: 'networkidle' })
    const lcp = await page.evaluate(
      () =>
        new Promise((resolve) => {
          new PerformanceObserver((list) => {
            const e = list.getEntries().at(-1)
            resolve(e ? Math.round(e.startTime) : null)
          }).observe({ type: 'largest-contentful-paint', buffered: true })
          setTimeout(() => resolve(null), 3000)
        }),
    )
    phase = 'scrolled'
    await settle(page)
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
