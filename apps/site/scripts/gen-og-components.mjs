// Generate public/og/components/<name>.png for every registry component from
// the live /og?component=<name> route (see OgCard.tsx — it reads name/category/
// description straight from registry.json, so no hand-authored copy is needed
// per component). Run via `pnpm og:generate:components` (boots preview,
// screenshots each, exits). PNGs are committed (rasterized text isn't
// byte-deterministic across machines) — NOT part of `pnpm regen`. Mirrors
// gen-og.mjs's single-card approach, batched over the registry.
import { mkdirSync, readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { chromium } from '@playwright/test'

const __dirname = fileURLToPath(new URL('.', import.meta.url))
const root = join(__dirname, '..', '..', '..')
const BASE_URL = process.env.OG_BASE_URL ?? 'http://localhost:4180'

const registry = JSON.parse(readFileSync(join(root, 'registry.json'), 'utf8'))
const names = registry.components.map((c) => c.name)

// Override for environments whose bundled Playwright browser doesn't match the
// pinned @playwright/test version (e.g. a sandbox with an older cached build).
const executablePath = process.env.PLAYWRIGHT_CHROMIUM_PATH
const browser = await chromium.launch(executablePath ? { executablePath } : undefined)
const page = await browser.newPage({ viewport: { width: 1200, height: 630 } })

for (const [i, name] of names.entries()) {
  const outPath = join(__dirname, '..', 'public', 'og', 'components', `${name}.png`)
  mkdirSync(dirname(outPath), { recursive: true })
  await page.goto(`${BASE_URL}/og?component=${encodeURIComponent(name)}`, {
    waitUntil: 'networkidle',
  })
  await page.waitForTimeout(150)
  await page.screenshot({ path: outPath })
  if ((i + 1) % 25 === 0 || i === names.length - 1) {
    console.log(`  ${i + 1}/${names.length} component og cards written`)
  }
}

await browser.close()
console.log(`wrote ${names.length} component og cards to public/og/components/`)
