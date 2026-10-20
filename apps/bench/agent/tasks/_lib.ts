import type { Locator, Page } from '@playwright/test'

// Playwright doesn't export its role union, so derive it from the one API that takes it.
export type AriaRole = Parameters<Page['getByRole']>[0]

/** Bounded so one missing link fails the check in seconds rather than eating the 120 s EVAL budget. */
const SETTLE_MS = 5000
const MAX_PAGES = 10

export interface GoToOptions {
  /** Set false for an in-page toggle that neither routes nor re-renders. Default true. */
  expectNavigation?: boolean
  /** How long to wait for the click to have any effect. Default 5 s. */
  timeoutMs?: number
}

/**
 * Click the first visible link or button whose name matches, then wait until the click had an
 * observable effect, and throw if it had none.
 *
 * Agents pick history routing or hash routing freely, and a hash change fires no load event, so
 * there is no single "navigation finished" signal. We wait for any evidence of an effect instead:
 * the URL changed, the clicked element left the DOM, or the DOM mutated (a client-side route
 * swap). Network idle is deliberately not evidence: in an SPA it is usually already true, so it
 * would win the race and make a dead link look like a success, hiding exactly the failure the
 * check exists to catch. A bare `#` is not a URL change for the same reason.
 */
export async function goTo(
  page: Page,
  baseUrl: string,
  name: RegExp,
  opts: GoToOptions = {},
): Promise<void> {
  const { expectNavigation = true, timeoutMs = SETTLE_MS } = opts
  // A prior step may have left the browser on a blank page or another origin.
  if (!sameOrigin(page.url(), baseUrl)) await page.goto(baseUrl)
  const target = page
    .getByRole('link', { name })
    .or(page.getByRole('button', { name }))
    .and(page.locator(':visible'))
    .first()
  await target.waitFor({ state: 'visible', timeout: timeoutMs })
  const handle = await target.elementHandle({ timeout: timeoutMs })
  if (handle === null) throw new Error(`goTo: "${String(name)}" vanished before the click`)
  const before = page.url()
  // The observer counts only mutations after the click, so a clock or a polling widget that was
  // already ticking cannot make a dead link look like it worked. The capture-phase listener sets
  // the flag before any app handler runs, so a synchronous re-render still counts. childList and
  // characterData only: attribute churn (focus rings, aria-current) happens on a no-op click too.
  await page.evaluate(() => {
    const w = window as unknown as { __evalMutated?: boolean; __evalArmed?: () => void }
    w.__evalArmed?.()
    let clicked = false
    w.__evalMutated = false
    const onClick = () => {
      clicked = true
    }
    document.addEventListener('click', onClick, { capture: true, once: true })
    const observer = new MutationObserver(() => {
      if (clicked) w.__evalMutated = true
    })
    observer.observe(document.body, { childList: true, subtree: true, characterData: true })
    w.__evalArmed = () => {
      observer.disconnect()
      document.removeEventListener('click', onClick, { capture: true })
    }
  })
  await handle.click()
  if (!expectNavigation) return
  const strip = (u: string) => u.replace(/#$/, '')
  // Two signals, because neither covers both kinds of navigation: the in-page predicate dies with
  // the document on a full page load (its execution context is destroyed), while waitForURL alone
  // cannot see a client-side re-render that leaves the URL alone. Promise.any, not race, so the
  // context-destroyed rejection of the first cannot beat the second to the verdict.
  try {
    await Promise.any([
      page.waitForFunction(
        ({ el, was }) => {
          const w = window as unknown as { __evalMutated?: boolean }
          const stripHash = (u: string) => u.replace(/#$/, '')
          return (
            stripHash(location.href) !== stripHash(was) ||
            !el.isConnected ||
            w.__evalMutated === true
          )
        },
        { el: handle, was: before },
        { timeout: timeoutMs },
      ),
      page.waitForURL((url) => strip(url.href) !== strip(before), {
        timeout: timeoutMs,
        waitUntil: 'commit',
      }),
    ])
  } catch (error) {
    // Anything but "both timed out" is a real failure (page closed, crash) and keeps its message.
    const errors = error instanceof AggregateError ? error.errors : [error]
    if (errors.every((e) => e instanceof Error && e.name === 'TimeoutError'))
      throw new Error(`goTo: clicking "${String(name)}" did not navigate or change the page`)
    throw errors.find((e) => !(e instanceof Error && e.name === 'TimeoutError')) ?? error
  }
  // Late renders (data fetch after the route flips) should have settled before the caller queries.
  await page.waitForLoadState('domcontentloaded')
}

/**
 * Whether `check` comes true within `timeoutMs`, polling. For conditions no single locator can
 * wait on (one of several shapes, a count that should drop): an SPA renders after load, so a
 * one-shot read would fail a correct app that is merely a frame behind.
 */
export async function eventually(
  check: () => Promise<boolean>,
  timeoutMs: number = SETTLE_MS,
): Promise<boolean> {
  const deadline = Date.now() + timeoutMs
  for (;;) {
    if (await check()) return true
    if (Date.now() >= deadline) return false
    await new Promise((done) => setTimeout(done, 200))
  }
}

/** Whether any match is visible now. `.first()` alone would miss a visible match after a hidden one. */
export async function anyVisible(locator: Locator): Promise<boolean> {
  for (const el of await locator.all()) if (await el.isVisible()) return true
  return false
}

/** Throws (via the web-first assertion's own message) unless a matching element is visible. */
export async function expectVisible(page: Page, role: AriaRole, name: RegExp): Promise<void> {
  await page.getByRole(role, { name }).first().waitFor({ state: 'visible', timeout: SETTLE_MS })
}

/**
 * Find an element wherever the agent put it. The prompts don't say which page holds what, so
 * start at `/`, then visit each distinct nav link once, breadth-first, up to MAX_PAGES pages.
 * Returns the locator with the page left on the route where it was found.
 *
 * Discovery follows links only. A route reachable only through a button is invisible here, so an
 * EVAL that needs one must navigate there explicitly with `goTo`.
 */
export async function findOnAnyPage(
  page: Page,
  baseUrl: string,
  role: AriaRole,
  name: RegExp,
): Promise<Locator> {
  // Keyed by pageKey so `/`, `/#top` and `#features` count as one page, not three.
  const seen = new Set<string>()
  const queue: string[] = [baseUrl]
  while (queue.length > 0 && seen.size < MAX_PAGES) {
    const url = queue.shift()
    if (url === undefined) continue
    const key = pageKey(url)
    if (seen.has(key)) continue
    seen.add(key)
    await page.goto(url)
    await page.waitForLoadState('networkidle', { timeout: SETTLE_MS }).catch(() => undefined)
    const hit = page.getByRole(role, { name }).first()
    if (await hit.isVisible()) return hit
    for (const href of await navHrefs(page, baseUrl)) if (!seen.has(pageKey(href))) queue.push(href)
  }
  throw new Error(`No visible ${role} named ${String(name)} on ${seen.size} page(s)`)
}

function sameOrigin(a: string, b: string): boolean {
  try {
    return new URL(a).origin === new URL(b).origin
  } catch {
    return false
  }
}

/**
 * What makes two URLs the same page. Anchors (`#features`, bare `#`) stay on one history route, so
 * the hash is dropped; a `#/route` or `#!/route` hash IS the route in a hash-routed app, so it is
 * kept. A trailing slash never distinguishes pages (`/` and the bare origin are one).
 */
export function pageKey(href: string): string {
  const url = new URL(href)
  const path = url.pathname.replace(/\/+$/, '')
  const routeHash = /^#!?\//.test(url.hash) ? url.hash.replace(/\/+$/, '') : ''
  return `${url.origin}${path}${url.search}${routeHash === '#' || routeHash === '#!' ? '' : routeHash}`
}

/**
 * Same-app link targets as absolute URLs, deduplicated by page. Hrefs are plain DOM data, not a
 * payload we trust: each is re-checked against the app's origin before use.
 */
async function navHrefs(page: Page, baseUrl: string): Promise<string[]> {
  const out = new Map<string, string>()
  for (const link of await page.getByRole('link').all()) {
    if (!(await link.isVisible())) continue
    const href = await link.getAttribute('href')
    if (href === null) continue
    let abs: URL
    try {
      abs = new URL(href, page.url())
    } catch {
      continue
    }
    if (!sameOrigin(abs.href, baseUrl)) continue
    const key = pageKey(abs.href)
    if (!out.has(key)) out.set(key, abs.href)
  }
  return [...out.values()]
}
