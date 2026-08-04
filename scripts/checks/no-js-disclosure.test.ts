/**
 * No-JS disclosure canary — the base layer of `Accordion` and `Collapsible`, in a real
 * browser, with **no JavaScript attached at all**.
 *
 * Both components were rebuilt on `<details>`/`<summary>` so their panels render at first
 * paint and stay reachable with JS disabled (`clientJs: 'enhancement'`). Nothing in the
 * unit suite can prove that:
 *
 *  - jsdom does not expose `<summary>` as `role="button"`, carries no `aria-expanded`, does
 *    **not** activate `<summary>` on Enter/Space, and does **not** implement `<details name>`
 *    exclusivity. All four are verified jsdom gaps, not component defects — which means the
 *    component tests assert the structural contract and stop there.
 *  - So the actual platform behaviour the rebuild depends on has, until this file, never
 *    been executed anywhere.
 *
 * This mounts `renderToStaticMarkup` output — server HTML, never hydrated, which is exactly
 * the JS-off state — and drives it with a real keyboard and real clicks. If a future change
 * reintroduces a JS-only disclosure, the panel stops opening here and this fails.
 *
 * Run: `pnpm no-js:check` (requires a prior `pnpm build`).
 */
import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { createRequire } from 'node:module'
import { chromiumNote, resolveChromium } from './lib/chromium.ts'
import { after, before, describe, it } from 'node:test'
import { fileURLToPath, pathToFileURL } from 'node:url'

const ROOT = fileURLToPath(new URL('../..', import.meta.url))
const DIST = join(ROOT, 'packages/react/dist')
const built = existsSync(join(DIST, 'styles.css'))

const resolve = createRequire(new URL('../../packages/react/package.json', import.meta.url)).resolve
const load = async (specifier: string) => {
  const mod = await import(pathToFileURL(resolve(specifier)).href)
  return mod.default && !mod.chromium && !mod.createElement && !mod.renderToStaticMarkup
    ? mod.default
    : mod
}

/* eslint-disable @typescript-eslint/no-explicit-any -- dynamically loaded, see `load` */
let chromium: any
let h: any
let renderToStaticMarkup: any
let components: any
let browser: any
let page: any

let STYLES = ''

/**
 * Render to static HTML and mount it with the shipped stylesheet and no script of any kind.
 * No hydration call is made, so every behaviour observed after this point comes from the
 * browser's own `<details>` implementation.
 */
async function mountNoJs(node: unknown): Promise<void> {
  const html = renderToStaticMarkup(node as never)
  assert.ok(!/<script/i.test(html), 'static markup must not carry a script')
  await page.setContent(
    `<!doctype html><html><head><meta name="viewport" content="width=device-width">` +
      `<style>${STYLES}</style></head>` +
      `<body><div data-theme="light" id="root">${html}</div></body></html>`,
  )
}

/** Every `<details>` in the page, in document order, as `{ open, visibleBody }`. */
async function state(): Promise<{ open: boolean; bodyVisible: boolean }[]> {
  return page.evaluate(() =>
    [...document.querySelectorAll('details')].map((d) => {
      const body = d.querySelector('[role="region"]')
      return { open: d.open, bodyVisible: body ? (body as HTMLElement).checkVisibility() : false }
    }),
  )
}

before(async () => {
  if (!built) return
  ;({ chromium } = await load('@playwright/test'))
  ;({ createElement: h } = await load('react'))
  ;({ renderToStaticMarkup } = await load('react-dom/server'))
  components = await import(
    new URL('../../packages/react/dist/node/index.js', import.meta.url).href
  )
  STYLES = readFileSync(join(DIST, 'styles.css'), 'utf8')
  const executablePath = resolveChromium(chromium.executablePath())
  console.log(chromiumNote(executablePath))
  // Deliberately not wrapped in try/skip — a canary that passes when it could not run is
  // worse than no canary. Same reasoning as bare-page.test.ts.
  browser = await chromium.launch(executablePath ? { executablePath } : {})
  // Reduced motion, so the open/close transition is instant and visibility can be asserted
  // on the next tick. Both components already zero their `::details-content` transition
  // under `prefers-reduced-motion: reduce`, so this exercises a real user setting rather
  // than a test-only override — and it keeps the assertions off the wall clock.
  page = await browser.newPage({ reducedMotion: 'reduce' })
})

after(async () => {
  await browser?.close()
})

/** `<Accordion type=… defaultValue="one">` with two items. */
function accordion(type: 'single' | 'multiple') {
  const { Accordion, AccordionItem, AccordionTrigger, AccordionContent } = components
  const item = (value: string, label: string) =>
    h(
      AccordionItem,
      { key: value, value },
      h(AccordionTrigger, null, label),
      h(AccordionContent, null, `${label} content`),
    )
  return h(Accordion, { type, defaultValue: 'one' }, item('one', 'First'), item('two', 'Second'))
}

describe('no-js — the disclosure base layer works without hydration', () => {
  it('Accordion renders its default panel open and readable', { skip: !built }, async () => {
    await mountNoJs(accordion('single'))
    const [first, second] = await state()
    assert.equal(first?.open, true, 'defaultValue item must render open in server HTML')
    assert.equal(first?.bodyVisible, true, 'the open panel must be visible with no JS')
    assert.equal(second?.open, false)
    assert.equal(second?.bodyVisible, false, 'a closed panel must not be visible')
  })

  it('a closed panel contributes no layout box', { skip: !built }, async () => {
    await mountNoJs(accordion('single'))
    // The same class of defect `popover:check` exists to catch: an author `display` beating
    // the UA hide rule leaves an invisible box that still takes space and eats clicks.
    const heights = await page.evaluate(() =>
      [...document.querySelectorAll('details')].map((d) => ({
        details: d.getBoundingClientRect().height,
        summary: (d.querySelector('summary') as HTMLElement).getBoundingClientRect().height,
      })),
    )
    assert.equal(
      heights[1].details,
      heights[1].summary,
      'a closed <details> must be exactly as tall as its <summary>',
    )
  })

  it('a click opens a panel with no JavaScript', { skip: !built }, async () => {
    await mountNoJs(accordion('multiple'))
    await page.locator('summary').nth(1).click()
    const [, second] = await state()
    assert.equal(second?.open, true, 'the browser must open <details> on click')
    assert.equal(second?.bodyVisible, true)
  })

  it('Enter and Space activate the trigger with no JavaScript', { skip: !built }, async () => {
    await mountNoJs(accordion('multiple'))
    const second = page.locator('summary').nth(1)
    await second.focus()
    assert.equal(
      await page.evaluate(() => document.activeElement?.tagName),
      'SUMMARY',
      '<summary> must be focusable',
    )
    await page.keyboard.press('Enter')
    assert.equal((await state())[1]?.open, true, 'Enter must open the panel')
    await page.keyboard.press('Enter')
    assert.equal((await state())[1]?.open, false, 'Enter must close it again')
    await page.keyboard.press(' ')
    assert.equal((await state())[1]?.open, true, 'Space must open the panel')
  })

  it(
    'type="single" is exclusive with no JavaScript, via <details name>',
    { skip: !built },
    async () => {
      await mountNoJs(accordion('single'))
      const names = await page.evaluate(() =>
        [...document.querySelectorAll('details')].map((d) => d.getAttribute('name')),
      )
      assert.ok(names[0], 'single mode must emit a name to group the items')
      assert.equal(names[0], names[1], 'grouped items must share one name')

      await page.locator('summary').nth(1).click()
      const [first, second] = await state()
      assert.equal(second?.open, true)
      assert.equal(first?.open, false, 'opening one must close its sibling, with no JS')
    },
  )

  it('type="multiple" leaves the items ungrouped', { skip: !built }, async () => {
    await mountNoJs(accordion('multiple'))
    const names = await page.evaluate(() =>
      [...document.querySelectorAll('details')].map((d) => d.getAttribute('name')),
    )
    assert.deepEqual(names, [null, null], 'multiple mode must not group items')

    await page.locator('summary').nth(1).click()
    const [first, second] = await state()
    assert.equal(first?.open, true, 'both items stay open in multiple mode')
    assert.equal(second?.open, true)
  })

  it('Collapsible opens from the keyboard with no JavaScript', { skip: !built }, async () => {
    const { Collapsible } = components
    await mountNoJs(h(Collapsible, { trigger: 'Toggle' }, 'Body'))
    assert.equal((await state())[0]?.open, false)
    await page.locator('summary').first().focus()
    await page.keyboard.press('Enter')
    const [only] = await state()
    assert.equal(only?.open, true, 'Enter must open the disclosure')
    assert.equal(only?.bodyVisible, true, 'the revealed body must be visible')
  })
})
