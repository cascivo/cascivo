/**
 * `cascivo-workbench test`: every entry, in each theme asked for, through axe — and, with
 * `--screenshots`, against a committed picture of itself.
 *
 * The 2026-10-07 plan named Vitest browser mode for this. A Playwright loop over the
 * workbench's own index does the same job without asking the project for a Vitest browser
 * config, a provider package and a test file per entry, and it is the shape this repo's
 * Storybook axe sweep already has, which is what lets the two run side by side (P4-5).
 *
 * Playwright and axe-core are the project's, not this package's dependencies: most people
 * browse and never test, and neither is small.
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { resolver } from './plugin.mjs'

/** Last in the lookup: inside this repo the workbench's own dev dependencies supply both. */
const PKG_ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')

/** WCAG 2.x A/AA, as the Storybook sweep runs it. */
const TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa']
const CONCURRENCY = 4

/** Chromium from whichever Playwright package the project has, else `null`. */
async function chromiumFrom(resolve) {
  for (const specifier of ['playwright', '@playwright/test', 'playwright-core']) {
    const file = resolve(specifier)
    if (!file) continue
    // CommonJS: whether `chromium` is a named export depends on how the package builds it.
    const mod = await import(pathToFileURL(file).href)
    const chromium = mod.chromium ?? mod.default?.chromium
    if (chromium) return chromium
  }
  return null
}

function screenshotName(entryId, theme) {
  return `${entryId.replace(/[^\w.-]+/g, '__')}--${theme}.png`
}

/**
 * @param {{
 *   baseUrl: string,
 *   from: string[],
 *   themes: string[],
 *   only?: string | null,
 *   screenshots?: string | null,
 *   update?: boolean,
 *   log?: (line: string) => void,
 * }} options
 * @returns {Promise<{ checked: number, skipped: string[], failures: { entry: string, theme: string, problem: string }[] }>}
 */
export async function runTests({
  baseUrl,
  from,
  themes,
  only = null,
  screenshots = null,
  update = false,
  log = () => {},
}) {
  const resolve = resolver([...from, PKG_ROOT])
  const chromium = await chromiumFrom(resolve)
  const axePath = resolve('axe-core/axe.min.js')
  if (!chromium || !axePath) {
    throw new Error(
      'cascivo-workbench test needs Playwright and axe-core in the project:\n' +
        '  npm i -D playwright axe-core && npx playwright install chromium',
    )
  }

  const response = await fetch(new URL('/index.json', baseUrl))
  const raw = await response.json()
  if (typeof raw !== 'object' || raw === null || !Array.isArray(raw.entries)) {
    throw new Error(`${baseUrl}index.json is not a workbench index`)
  }
  const listed = raw.entries.filter(
    (e) =>
      typeof e?.id === 'string' &&
      typeof e?.url === 'string' &&
      (only === null || e.id.includes(only)),
  )
  const entries = listed.filter((e) => e.renders === true)
  const skipped = listed
    .filter((e) => e.renders !== true)
    .map((e) => `${e.id} (a snippet, not one JSX expression)`)
  if (screenshots) mkdirSync(screenshots, { recursive: true })

  const browser = await chromium.launch(
    process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {},
  )
  // One full load first. Vite discovers the dependencies the components import on the first
  // request and reloads when it has optimized them; a check that lands mid-reload sees two
  // copies of React, which is the server warming up, not the component failing.
  const warm = await browser.newPage()
  await warm.goto(baseUrl, { waitUntil: 'networkidle', timeout: 180_000 })
  await warm.waitForTimeout(1_000)
  await warm.close()
  const axe = readFileSync(axePath, 'utf8')
  const failures = []
  let checked = 0

  /**
   * One page per worker and theme, moved between entries by their hash: the page imports
   * every copied component, and loading it again for each entry made a sweep minutes long.
   * Each entry still mounts fresh (the stage remounts per entry) and is checked alone.
   */
  const pages = new Map()
  const pageFor = async (worker, theme, entry) => {
    const key = `${worker}:${theme}`
    const hash = new URL(entry.url, baseUrl).hash
    const existing = pages.get(key)
    if (existing) {
      existing.errors.length = 0
      await existing.page.evaluate((h) => {
        location.hash = h
      }, hash)
      return existing
    }
    const page = await browser.newPage({ viewport: { width: 1024, height: 768 } })
    const state = { page, errors: [] }
    page.on('pageerror', (e) => state.errors.push(e.message))
    const url = new URL(entry.url.replace(/theme=[^&#]*/, `theme=${theme}`), baseUrl)
    await page.goto(url.href, { waitUntil: 'networkidle', timeout: 120_000 })
    pages.set(key, state)
    return state
  }

  const check = async (worker, entry, theme) => {
    let state
    try {
      state = await pageFor(worker, theme, entry)
      const { page, errors } = state
      const hash = new URL(entry.url, baseUrl).hash
      const stage = page.locator(`[data-testid=stage][data-hash="${hash}"]`)
      await stage.waitFor({ timeout: 30_000 })
      // Let signal-driven mount effects settle before reading the DOM.
      await page.waitForTimeout(150)
      const failed = stage.locator('.wb-error')
      if ((await failed.count()) > 0) {
        const why = (await failed.locator('p').first().innerText()).trim()
        // Needs code from the host app (state, a placeholder component): not this entry's
        // accessibility, and not something a test of the copied component can supply. Any
        // other error is the component's own, and fails.
        if ((await failed.getAttribute('data-needs-host')) === 'true') {
          skipped.push(`${entry.id} (${why})`)
        } else failures.push({ entry: entry.id, theme, problem: `render error: ${why}` })
        return
      }
      if (errors.length > 0) {
        failures.push({ entry: entry.id, theme, problem: `page error: ${errors[0]}` })
        return
      }
      const result = await page.evaluate(
        async ({ source, tags }) => {
          if (!globalThis.axe) new Function(source)()
          // The whole document, not the stage: an overlay renders into a portal on <body>,
          // and an embed page holds nothing of the workbench's own to check.
          return globalThis.axe.run(document, { runOnly: { type: 'tag', values: tags } })
        },
        { source: axe, tags: TAGS },
      )
      for (const v of result.violations) {
        failures.push({
          entry: entry.id,
          theme,
          problem: `${v.id} (${v.impact}, ${v.nodes.length} node(s)) — ${v.help}`,
          nodes: v.nodes.map((n) => n.target.join(' ')),
        })
      }
      if (screenshots) {
        const file = join(screenshots, screenshotName(entry.id, theme))
        const actual = await stage.screenshot({ animations: 'disabled' })
        if (update || !existsSync(file)) writeFileSync(file, actual)
        else if (!readFileSync(file).equals(actual)) {
          writeFileSync(file.replace(/\.png$/, '.actual.png'), actual)
          failures.push({ entry: entry.id, theme, problem: `screenshot differs from ${file}` })
        }
      }
      checked += 1
    } catch (e) {
      failures.push({ entry: entry.id, theme, problem: String(e).split('\n')[0] })
      // A page an entry broke is not reused for the next one.
      if (state) {
        pages.delete(`${worker}:${theme}`)
        await state.page.close().catch(() => {})
      }
    }
  }

  const queue = entries.flatMap((entry) => themes.map((theme) => [entry, theme]))
  const total = queue.length
  log(
    `Checking ${entries.length} entries × ${themes.length} theme(s) with axe [${TAGS.join(', ')}]…`,
  )
  let done = 0
  await Promise.all(
    Array.from({ length: CONCURRENCY }, async (_, worker) => {
      while (queue.length > 0) {
        const [entry, theme] = queue.shift()
        await check(worker, entry, theme)
        done += 1
        if (done % 50 === 0) log(`  ${done}/${total}`)
      }
    }),
  )
  await browser.close()
  return { checked, skipped: [...new Set(skipped)], failures }
}
