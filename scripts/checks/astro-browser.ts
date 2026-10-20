/**
 * Browser assertions for the naive-adopter Astro arm of `pnpm framework:check`.
 *
 * The fixture is `scripts/checks/fixtures/astro-naive`: what `astro add react && astro add mdx
 * && pnpm add @cascivo/react` gives an adopter, one page per client directive plus MDX, view
 * transitions, shared state and theming. `framework-install.test.ts` installs it from the packed
 * tarballs and calls these against `astro preview` and `astro dev`. Each function throws with
 * the cause and the fix in its message; none of them skips, because a canary that passes when
 * it could not run is worse than none.
 */
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import type { Page } from '@playwright/test'

/** Every route in the fixture. */
export const PAGES = [
  'load',
  'visible',
  'idle',
  'only',
  'none',
  'mdx',
  'vt-a',
  'vt-b',
  'shared',
  'theme',
] as const

/** The pages whose counter island must hydrate, one per client directive (and MDX). */
const HYDRATING = ['load', 'visible', 'idle', 'only', 'mdx'] as const

const WAIT = { timeout: 15_000 }

/** A dark theme in the envelope `persistedSignal` writes. */
const STORED_DARK = JSON.stringify({ v: 1, value: 'dark' })

/** CSS-module class names as `@cascivo/react` ships them: `_name_hash_line`. */
const MODULE_CLASS = /\b(_[a-zA-Z][\w-]*_[a-z0-9]{5,}_\d+)\b/g

/** The names of the canonical `@layer` statement, read from its single source of truth. */
function canonicalLayers(): string[] {
  const file = fileURLToPath(new URL('../../packages/tokens/src/layers.css', import.meta.url))
  const statement = /^@layer\s+([^;{]+);/m.exec(readFileSync(file, 'utf8'))?.[1]
  assert.ok(statement, 'packages/tokens/src/layers.css has no @layer statement')
  return statement.split(',').map((n) => n.trim())
}

async function fetchText(url: string): Promise<string> {
  const response = await fetch(url)
  assert.equal(response.status, 200, `GET ${url} answered ${response.status}`)
  return response.text()
}

/**
 * The CSS a page's first response carries, in document order: every `<style>` body and every
 * `<link rel="stylesheet">` it references, fetched. Astro dev inlines module CSS as `<style>`;
 * a build links hashed files.
 */
export async function pageCss(url: string): Promise<string> {
  const html = await fetchText(url)
  const parts: string[] = []
  for (const m of html.matchAll(/<style[^>]*>([\s\S]*?)<\/style>|<link\b([^>]*)>/g)) {
    if (m[1] !== undefined) {
      parts.push(m[1])
      continue
    }
    const attrs = m[2] ?? ''
    const href = /\bhref="([^"]+)"/.exec(attrs)?.[1]
    if (href === undefined || !/\brel="stylesheet"/.test(attrs)) continue
    parts.push(await fetchText(new URL(href.replaceAll('&amp;', '&'), url).href))
  }
  return parts.join('\n')
}

/**
 * Every cascivo class in the server-rendered HTML has a rule in the CSS that response loads.
 * Returns how many classes it checked, so the caller can require that some page used any.
 */
export async function assertFirstResponseStyled(url: string): Promise<number> {
  const html = await fetchText(url)
  // From class attributes only: dev inlines the CSS itself, whose hashed keyframe names
  // match the same pattern.
  const classes = [...html.matchAll(/\bclass="([^"]*)"/g)].map((m) => m[1]!).join(' ')
  const used = [...new Set([...classes.matchAll(MODULE_CLASS)].map((m) => m[1]!))]
  if (used.length === 0) return 0
  const css = await pageCss(url)
  const unmatched = used.filter((c) => !css.includes(`.${c}`))
  assert.deepEqual(
    unmatched,
    [],
    `${url}: the first response references cascivo classes with no rule in the CSS it loads, ` +
      'so the page paints unstyled until (or unless) JavaScript fixes it. Check the ' +
      '`astro-component` keyword on @cascivo/react and the `module` condition ahead of `node` ' +
      'in its exports map. See docs/USING-WITH-ASTRO.md.',
  )
  return used.length
}

/** Scrolls through the page and waits until every island on it has hydrated. */
async function waitForIslands(page: Page): Promise<void> {
  await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight))
  // Astro drops `ssr` from an <astro-island> once it has hydrated it.
  await page.waitForFunction(
    () => [...document.querySelectorAll('astro-island')].every((i) => !i.hasAttribute('ssr')),
    undefined,
    WAIT,
  )
}

async function waitForText(page: Page, selector: string, text: string, why: string) {
  try {
    await page.waitForFunction(
      ([s, t]) => document.querySelector(s!)?.textContent?.includes(t!) === true,
      [selector, text] as const,
      WAIT,
    )
  } catch {
    const actual = await page
      .locator(selector)
      .first()
      .textContent()
      .catch(() => null)
    assert.fail(`${page.url()}: expected ${selector} to contain "${text}", got "${actual}". ${why}`)
  }
}

/** Clicks each directive's counter and expects it to count; shared state and Toast work. */
export async function assertHydrates(page: Page, base: string): Promise<void> {
  for (const route of HYDRATING) {
    await page.goto(`${base}/${route}`)
    await waitForIslands(page)
    await page.click('[data-testid="counter"]')
    await waitForText(
      page,
      '[data-testid="counter"]',
      'Count 1',
      `The client:${route} island did not respond to a click, so it never hydrated.`,
    )
  }

  await page.goto(`${base}/load`)
  await waitForIslands(page)
  await page.getByRole('tab', { name: 'Second tab' }).click()
  await page.getByText('Second panel').waitFor({ state: 'visible', ...WAIT })

  // No directive: static HTML and no JavaScript.
  await page.goto(`${base}/none`)
  assert.equal(
    await page.locator('astro-island').count(),
    0,
    'the no-directive page shipped an island; it should be static HTML with no JavaScript',
  )

  await page.goto(`${base}/shared`)
  await waitForIslands(page)
  await page.click('[data-testid="shared-increment"]')
  await waitForText(
    page,
    '[data-testid="shared-display"]',
    'Shared 1',
    'Two islands importing one module-level signal must share it.',
  )
  await page.click('[data-testid="notify"]')
  await page.getByText('Saved from an island').waitFor({ state: 'visible', ...WAIT })
}

/**
 * Visits every page with a stored `dark` theme and requires zero page errors and no hydration
 * message. The stored theme is what makes a mismatch possible: the server renders 'light'.
 */
export async function assertNoHydrationErrors(page: Page, base: string): Promise<void> {
  const errors: string[] = []
  page.on('pageerror', (error) => errors.push(`${page.url()} pageerror: ${error.message}`))
  page.on('console', (message) => {
    if (/#418|hydrat/i.test(message.text())) {
      errors.push(`${page.url()} console.${message.type()}: ${message.text()}`)
    }
  })
  await page.addInitScript((stored) => {
    localStorage.setItem('cascivo-theme', stored)
  }, STORED_DARK)

  for (const route of PAGES) {
    await page.goto(`${base}/${route}`)
    await waitForIslands(page)
    if (route === 'theme') {
      // Non-vacuity: the island must end up showing the stored theme, else no mismatch
      // could have happened and a clean run here would prove nothing.
      await waitForText(
        page,
        '[data-probe="bare"]',
        'dark',
        'useTheme() never showed the stored theme after hydration.',
      )
    }
    // React reports recoverable hydration errors after the commit.
    await page.waitForTimeout(300)
  }
  assert.deepEqual(
    errors,
    [],
    'Hydration errors on a page with a stored dark theme. useTheme() must render the server ' +
      "snapshot ('light') while hydrating and the stored value right after (Task 3, " +
      'packages/core/src/theme.tsx).',
  )
}

async function dataTheme(page: Page): Promise<string | null> {
  return page.evaluate(() => document.documentElement.getAttribute('data-theme'))
}

/** Sets `dark` on vt-a, soft-navigates to vt-b and back, and expects `dark` to hold. */
export async function assertThemeSurvivesSoftNav(page: Page, base: string): Promise<void> {
  await page.goto(`${base}/vt-a`)
  await waitForIslands(page)
  await page.click('[data-testid="theme-dark"]')
  assert.equal(await dataTheme(page), 'dark', 'applyTheme("dark") did not set data-theme')

  // A full load would re-run the head script and prove nothing; a soft one keeps this marker.
  await page.evaluate(() => Object.assign(window, { __cascivoSoftNav: true }))
  for (const [link, heading] of [
    ['link-b', 'Page B'],
    ['link-a', 'Page A'],
  ] as const) {
    await page.click(`[data-testid="${link}"]`)
    await page.getByRole('heading', { name: heading }).waitFor(WAIT)
    assert.equal(
      await page.evaluate(() => '__cascivoSoftNav' in window),
      true,
      'the link did a full page load; <ClientRouter> is not intercepting navigation',
    )
    assert.equal(
      await dataTheme(page),
      'dark',
      `After a <ClientRouter> navigation to ${heading} data-theme is no longer "dark". The swap ` +
        "copies the next page's server-rendered <html> attributes; the theme script must " +
        're-run on astro:after-swap (themePreloadScript({ reapplyOn }), injected by ' +
        '@cascivo/astro).',
    )
  }
}

/**
 * The first `@layer` rule in the page CSS is a statement whose `cascivo.*` names are exactly
 * the canonical order: a block first would fix the order by accident of import order, and a
 * statement missing a name appends it on top. A leading `vendor` and app layers between
 * `cascivo.blocks` and `cascivo.override` (where layers.css documents them) are allowed.
 */
export function assertLayerOrderFirst(css: string): void {
  const stripped = css.replace(/\/\*[\s\S]*?\*\//g, '')
  const first = /@layer\s+([^;{]*)([;{])/.exec(stripped)
  assert.ok(first, 'the page CSS has no @layer rule at all')
  assert.equal(
    first[2],
    ';',
    `the first @layer rule is a block (@layer ${first[1]!.trim()} { … }), not the order ` +
      'statement, so the cascade order depends on which stylesheet loaded first.',
  )
  const names = first[1]!.split(',').map((n) => n.trim())
  const canonical = canonicalLayers()
  const rest = names[0] === 'vendor' ? names.slice(1) : names
  const blocks = rest.indexOf('cascivo.blocks')
  const override = rest.indexOf('cascivo.override')
  const misplaced = rest.filter(
    (n, i) => !canonical.includes(n) && !(i > blocks && i < override && blocks !== -1),
  )
  assert.deepEqual(
    { order: rest.filter((n) => canonical.includes(n)), misplaced },
    { order: canonical, misplaced: [] },
    `the first @layer statement is "@layer ${names.join(', ')};". It must carry every ` +
      'canonical name in the order of packages/tokens/src/layers.css, with only `vendor` ' +
      'before them and app layers between cascivo.blocks and cascivo.override.',
  )
}

/** No island hydrates `@cascivo/react`'s barrel: that ships every component's JS and CSS. */
export function assertNoBarrelIsland(html: string): void {
  const urls = [...html.matchAll(/<astro-island\b[^>]*\bcomponent-url="([^"]+)"/g)].map(
    (m) => m[1]!,
  )
  // Dev serves the module by its node_modules path. A build names the island chunk after the
  // module, so the barrel (`dist/index.js`) becomes `index.<hash>.js`; the fixture has no
  // component file named index.
  const barrel = urls.filter(
    (u) =>
      /@cascivo(?:\/|\+)react[^"]*\/dist\/index\.js/.test(u) ||
      /\/_astro\/index\.[\w-]+\.js$/.test(u),
  )
  assert.deepEqual(
    barrel,
    [],
    "an island's component-url is @cascivo/react's barrel, so hydrating it loads every " +
      'component. Hydrate a component of your own that imports what it needs (compose in .tsx).',
  )
}

/**
 * Opens the Popover, then the Modal, in the `transition:persist` island on vt-a with
 * `Element.prototype.moveBefore` deleted, navigates to vt-b each time, and expects each to
 * still be open, and the Modal still modal, with Escape closing it. Without `moveBefore`,
 * Astro re-inserts the island by detaching it, which drops both out of the top layer.
 */
export async function assertModalSurvivesPersist(page: Page, base: string): Promise<void> {
  await page.addInitScript(() => {
    // Chromium has moveBefore; Safari and Firefox (and older Chromium) do not.
    delete (Element.prototype as { moveBefore?: unknown }).moveBefore
  })

  await page.goto(`${base}/vt-a`)
  await waitForIslands(page)
  assert.equal(
    await page.evaluate(
      () => typeof (document.documentElement as { moveBefore?: unknown }).moveBefore,
    ),
    'undefined',
    'the init script did not remove moveBefore, so this would test the atomic-move path only',
  )

  await page.getByRole('button', { name: 'Open popover' }).click()
  await page.waitForFunction(() => document.querySelector('[popover]:popover-open') !== null)
  await page.click('[data-testid="popover-link"]')
  await page.getByRole('heading', { name: 'Page B' }).waitFor(WAIT)
  try {
    await page.waitForFunction(
      () => document.querySelector('[popover]:popover-open') !== null,
      undefined,
      {
        timeout: 2_000,
      },
    )
  } catch {
    assert.fail(
      'The Popover in the transition:persist island closed during the navigation. Without ' +
        'moveBefore the island is detached and re-inserted, which hides an open popover; ' +
        'usePopover must re-show it (Task 5, packages/components/src/popover/use-popover.ts).',
    )
  }
  await page.keyboard.press('Escape')
  await page.waitForFunction(() => document.querySelector('[popover]:popover-open') === null)

  await page.goto(`${base}/vt-a`)
  await waitForIslands(page)
  await page.click('[data-testid="open-modal"]')
  await page.waitForFunction(() => document.querySelector('dialog:modal') !== null)
  await page.click('[data-testid="modal-link"]')
  await page.getByRole('heading', { name: 'Page B' }).waitFor(WAIT)
  try {
    await page.waitForFunction(() => document.querySelector('dialog:modal') !== null, undefined, {
      timeout: 2_000,
    })
  } catch {
    assert.fail(
      'The Modal in the transition:persist island is no longer modal after the navigation ' +
        '(no dialog matches :modal), so Escape and the backdrop are dead. Modal must restore ' +
        'showModal() after re-insertion (Task 5, packages/components/src/modal/modal.tsx).',
    )
  }
  await page.keyboard.press('Escape')
  try {
    await page.waitForFunction(
      () => document.querySelector('dialog[open]') === null,
      undefined,
      WAIT,
    )
  } catch {
    assert.fail('Escape did not close the restored Modal.')
  }
}
