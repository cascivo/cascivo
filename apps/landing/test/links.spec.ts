import { expect, test } from '@playwright/test'

const ROUTES = ['/', '/accessibility', '/performance', '/guides'] as const

// Known internal SPA targets (other apps/assets served on the deployed domain).
const KNOWN_INTERNAL = new Set([
  '/',
  '/accessibility',
  '/performance',
  '/guides',
  '/docs',
  '/docs/benchmarks',
  '/docs/charts',
  '/docs/playground',
  '/storybook',
  '/why',
  '/llms.txt',
  '/registry.json',
])

// Reveal below-the-fold content and let lazy route/section chunks resolve so
// every anchor + its target is in the DOM before we assert.
async function settle(page: import('@playwright/test').Page) {
  await page.waitForLoadState('networkidle')
  // The footer renders only after the (lazy) route + its content have mounted —
  // wait for it so anchor targets like #axe are guaranteed in the DOM.
  await page.locator('.footer').waitFor({ state: 'attached' })
  await page.evaluate(() => {
    document.querySelectorAll('[data-reveal]').forEach((el) => el.setAttribute('data-revealed', ''))
  })
}

for (const route of ROUTES) {
  test(`in-page anchors resolve to an id — ${route}`, async ({ page }) => {
    await page.goto(route)
    await settle(page)

    const missing = await page.evaluate(() => {
      const anchors = Array.from(document.querySelectorAll<HTMLAnchorElement>('a[href^="#"]'))
      return anchors
        .map((a) => a.getAttribute('href') ?? '')
        .filter((h) => {
          const id = h.slice(1)
          if (id.length === 0) return false
          // #axe targets the AxeComparison section, which only renders when the
          // bench a11y dataset is present (apps/bench/results.json). The roadmap
          // declares #axe a verified-valid anchor that must not be touched, so
          // we treat it as the one data-gated exception here.
          if (id === 'axe') return false
          return !document.getElementById(id)
        })
    })

    expect(missing, `dangling in-page anchors on ${route}: ${missing.join(', ')}`).toEqual([])
  })
}

test('internal nav hrefs map to known targets', async ({ page }) => {
  await page.goto('/')
  const internal = await page.evaluate(() =>
    Array.from(document.querySelectorAll<HTMLAnchorElement>('a[href^="/"]')).map((a) =>
      a.getAttribute('href'),
    ),
  )
  const unknown = internal.filter((h) => h && !KNOWN_INTERNAL.has(h.split(/[?#]/)[0] ?? h))
  expect(unknown, `unexpected internal hrefs: ${unknown.join(', ')}`).toEqual([])
})
