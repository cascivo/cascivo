// Capture screenshots of the third-party sites built with cascivo, shown on
// the landing /showcase page. Output: apps/docs/public/showcase/<slug>.jpg
// (1280×800 @2x).
//
// Like public/og.png and the demo screenshots, these are committed binary
// assets and are NOT part of `pnpm regen` / the drift gate — rasterised output
// of live third-party sites is not byte-deterministic and the sites change
// over time. Re-run this on demand to refresh:
//
//   pnpm exec playwright install chromium   # once, if no browser
//   node scripts/showcase/capture.mjs
//
// The site list mirrors apps/docs/src/pages/showcase/data.ts.
import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const here = dirname(fileURLToPath(import.meta.url))
const root = resolve(here, '..', '..')
const OUT = resolve(root, 'apps/docs/public/showcase')

/** Keep in sync with apps/docs/src/pages/showcase/data.ts. */
const SITES = [
  { slug: 'pagome', url: 'https://pagome.com' },
  { slug: 'bpmnkit', url: 'https://bpmnkit.com' },
  { slug: 'weeklyfoo', url: 'https://weeklyfoo.directory' },
  { slug: 'u11g', url: 'https://u11g.com' },
  { slug: 'sharu', url: 'https://new.sharu.io' },
  { slug: 'aime', url: 'https://aime.directory' },
]

const DESKTOP = { width: 1280, height: 800 }

async function captureOne(ctxFactory, site, viewport) {
  const ctx = await ctxFactory(viewport)
  const page = await ctx.newPage()
  try {
    try {
      await page.goto(site.url, { waitUntil: 'networkidle', timeout: 45_000 })
    } catch {
      // Some sites keep long-lived connections open — fall back to DOM ready.
      await page.goto(site.url, { waitUntil: 'domcontentloaded', timeout: 45_000 })
    }
    // Let fonts/hero imagery settle, then nudge any lazy content into view.
    await page.waitForTimeout(2_500)
    await page.evaluate(() => window.scrollTo(0, 0))
    const buf = await page.screenshot({
      type: 'jpeg',
      quality: 80,
      clip: { x: 0, y: 0, width: viewport.width, height: viewport.height },
    })
    writeFileSync(resolve(OUT, `${site.slug}.jpg`), buf)
    console.log(`  captured ${site.slug}.jpg`)
  } finally {
    await page.close()
    await ctx.close()
  }
}

async function main() {
  let chromium
  try {
    ;({ chromium } = await import('@playwright/test'))
  } catch {
    console.error('Playwright not available. Install it, then re-run:')
    console.error('  pnpm exec playwright install chromium')
    process.exit(1)
  }

  mkdirSync(OUT, { recursive: true })
  const browser = await chromium.launch()
  const ctxFactory = (viewport) =>
    browser.newContext({
      viewport,
      deviceScaleFactor: 2,
      colorScheme: 'light',
      // Tolerate TLS-intercepting proxies (e.g. sandboxed CI egress).
      ignoreHTTPSErrors: true,
    })

  for (const site of SITES) {
    console.log(`${site.url}`)
    await captureOne(ctxFactory, site, DESKTOP)
  }
  await browser.close()
  console.log(`\nWrote ${SITES.length} site screenshots to apps/docs/public/showcase/`)
}

await main()
