// Generate public/og.png (1200×630) from the live /og route.
// Run via `pnpm og:generate` (boots preview, screenshots, exits). The PNG is
// committed so cold clones / social crawlers always have it; it is NOT part of
// `pnpm regen` (rasterized text is not byte-deterministic across machines).
import { chromium } from '@playwright/test'

const URL = process.env.OG_URL ?? 'http://localhost:4180/og'

// Override for environments whose bundled Playwright browser doesn't match the
// pinned @playwright/test version (mirrors gen-og-components.mjs).
const executablePath = process.env.PLAYWRIGHT_CHROMIUM_PATH
const browser = await chromium.launch(executablePath ? { executablePath } : undefined)
const page = await browser.newPage({ viewport: { width: 1200, height: 630 } })
await page.goto(URL, { waitUntil: 'networkidle' })
await page.waitForTimeout(500)
await page.screenshot({ path: 'public/og.png' })
await browser.close()
console.log('wrote public/og.png (1200x630)')
