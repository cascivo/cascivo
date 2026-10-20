import type { Locator, Page } from '@playwright/test'

// Playwright doesn't export its role union, so derive it from the one API that takes it.
export type AriaRole = Parameters<Page['getByRole']>[0]

/** Bounded so one missing link fails the check in seconds rather than eating the 120 s EVAL budget. */
const SETTLE_MS = 5000
const MAX_PAGES = 10

/**
 * Click the first visible link or button whose name matches, then wait for the app to settle.
 *
 * Agents pick history routing or hash routing freely, and a hash change fires no load event, so
 * there is no single signal to wait on. Instead: either the URL changes, or the clicked element
 * leaves the DOM (a route swap), or the network goes idle. Whichever comes first ends the wait;
 * a click that does none of those (an in-page button) just times out quietly.
 */
export async function goTo(page: Page, baseUrl: string, name: RegExp): Promise<void> {
  // A prior step may have left the browser on a blank page or another origin.
  if (!page.url().startsWith(baseUrl)) await page.goto(baseUrl)
  const target = page
    .getByRole('link', { name })
    .or(page.getByRole('button', { name }))
    .and(page.locator(':visible'))
    .first()
  await target.waitFor({ state: 'visible', timeout: SETTLE_MS })
  const before = page.url()
  await target.click()
  await Promise.race([
    page.waitForURL((url) => url.href !== before, { timeout: SETTLE_MS }),
    target.waitFor({ state: 'detached', timeout: SETTLE_MS }),
    page.waitForLoadState('networkidle', { timeout: SETTLE_MS }),
  ]).catch(() => undefined)
  // The route may render after the URL flips; let the DOM catch up before the caller queries it.
  await page.waitForLoadState('domcontentloaded')
}

/** Throws (via the web-first assertion's own message) unless a matching element is visible. */
export async function expectVisible(page: Page, role: AriaRole, name: RegExp): Promise<void> {
  await page.getByRole(role, { name }).first().waitFor({ state: 'visible', timeout: SETTLE_MS })
}

/**
 * Find an element wherever the agent put it. The prompts don't say which page holds what, so
 * start at `/`, then visit each distinct nav link once, breadth-first, up to MAX_PAGES pages.
 * Returns the locator with the page left on the route where it was found.
 */
export async function findOnAnyPage(
  page: Page,
  baseUrl: string,
  role: AriaRole,
  name: RegExp,
): Promise<Locator> {
  const seen = new Set<string>()
  const queue: string[] = [baseUrl]
  while (queue.length > 0 && seen.size < MAX_PAGES) {
    const url = queue.shift()
    if (url === undefined || seen.has(url)) continue
    seen.add(url)
    await page.goto(url)
    await page.waitForLoadState('networkidle', { timeout: SETTLE_MS }).catch(() => undefined)
    const hit = page.getByRole(role, { name }).first()
    if (await hit.isVisible()) return hit
    for (const href of await navHrefs(page, baseUrl)) if (!seen.has(href)) queue.push(href)
  }
  throw new Error(`No visible ${role} named ${String(name)} on ${seen.size} page(s)`)
}

/**
 * Same-app link targets, resolved to absolute URLs. Hash routes (`#/settings`) resolve against
 * the page URL, so they come out as distinct entries too. Reading hrefs is plain DOM data, not a
 * payload we need to trust: every value is re-checked against baseUrl before use.
 */
async function navHrefs(page: Page, baseUrl: string): Promise<string[]> {
  const links = page.getByRole('link')
  const out: string[] = []
  for (const link of await links.all()) {
    if (!(await link.isVisible())) continue
    const href = await link.getAttribute('href')
    if (href === null) continue
    const abs = new URL(href, page.url()).href
    if (abs.startsWith(baseUrl) && !out.includes(abs)) out.push(abs)
  }
  return out
}
