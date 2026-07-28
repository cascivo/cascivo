/**
 * Bare-page canary — the browser facts that only show up with NO app CSS and MORE THAN ONE
 * component on the page.
 *
 * `computed:check` already renders the shipped `dist/` through real Chromium, and it could
 * not have caught any of the 2026-07-28 blockers, because of how it mounts:
 *
 * | | `computed:check` | this file |
 * | --- | --- | --- |
 * | page CSS | shipped `styles.css` inside a themed div | shipped `styles.css` and **nothing else** |
 * | layout | one component in a 640px box | full viewport, `<body>` at browser defaults |
 * | composition | one component at a time | **several components, stacked** |
 * | asserts | computed property values | those **plus** `scrollWidth` and real hit-testing |
 *
 * Those differences are the whole point (Mechanism E — see
 * `docs/internal/feedback/README.md`):
 *
 *  - **C12** — every app in this repo ships its own `box-sizing` reset, so no surface here
 *    had ever rendered on the browser's `content-box` default. A `Textarea` is `width: 100%`
 *    plus 32px of padding and a 2px border, so it computed 34px wider than its container and
 *    pushed a horizontal scrollbar onto a default install. Asserting that needs a page with
 *    no app CSS at all.
 *  - **C13** — a closed `MultiSelect`/`Sheet` panel kept its box and swallowed every click
 *    beneath it, invisibly. Asserting that needs something *underneath* the overlay, which a
 *    one-component-at-a-time harness never has.
 *  - **C14** — `AppShell`'s sidebar shrank under wide content. Needs two renders compared.
 *  - **C15** — dialog bodies had no gap between children. Needs real layout.
 *
 * ## Verification status of each assertion
 *
 * The plan's bar is "observe the guard failing on the pre-fix state" — so, precisely:
 *
 *  - **C12 — VERIFIED.** Re-running against a stylesheet with the `cascivo.reset`
 *    `box-sizing` rule stripped fails both assertions: `scrollWidth 1314` against
 *    `clientWidth 1280`, and `box-sizing: content-box`. Note the container had to be
 *    full-width to reproduce it — the ~34px overhang must reach past the *viewport* edge to
 *    move `scrollWidth`, so an earlier version of this test using a fixed 400px box passed
 *    on broken CSS. That is recorded in the test body.
 *  - **C13 — NOT verified here.** The assertion passes on the fixed CSS, but re-introducing
 *    `display: flex` into the panel's base rule did not make it fail, so its failure mode is
 *    unproven and the hit-test may not be reproducing the reporter's geometry. **C13 is
 *    guarded by `popover-hidden.test.ts`**, which *was* observed failing on the pre-fix
 *    source and named both offenders exactly. Treat this case as a regression tripwire, not
 *    as the proof.
 *  - **C14, C15 — NOT verified.** Both pass on the fixed CSS; neither was observed failing.
 *
 * Improving the C13/C14/C15 cases to fail on their pre-fix state is open work.
 *
 * Run: `pnpm bare-page:check` (requires a prior `pnpm build`).
 */
import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { createRequire } from 'node:module'
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
 * Mount markup on a page carrying the shipped stylesheet and **nothing else**.
 *
 * No reset, no width wrapper, no normalize — `<body>` sits at the browser's own defaults.
 * That is exactly the state a consumer who follows getting-started and writes no CSS is in,
 * and it is the state no app in this repo has ever been in.
 */
async function mountBare(node: unknown, viewport = { width: 1280, height: 800 }): Promise<void> {
  await page.setViewportSize(viewport)
  const html = renderToStaticMarkup(node as never)
  await page.setContent(
    `<!doctype html><html><head><meta name="viewport" content="width=device-width">` +
      `<style>${STYLES}</style></head>` +
      `<body><div data-theme="light" id="root">${html}</div></body></html>`,
  )
}

before(async () => {
  if (!built) return
  ;({ chromium } = await load('@playwright/test'))
  ;({ createElement: h } = await load('react'))
  ;({ renderToStaticMarkup } = await load('react-dom/server'))
  // The CSS-free `node` entry; the stylesheet is loaded separately, as a browser does.
  components = await import(
    new URL('../../packages/react/dist/node/index.js', import.meta.url).href
  )
  STYLES = readFileSync(join(DIST, 'styles.css'), 'utf8')
  const executablePath = process.env['CASCIVO_CHROMIUM']
  // Deliberately not wrapped in try/skip — a canary that passes when it could not run is
  // worse than no canary. Same reasoning as computed-style.test.ts.
  browser = await chromium.launch(executablePath ? { executablePath } : {})
  page = await browser.newPage()
})

after(async () => {
  await browser?.close()
})

describe('bare-page — a default install fits the viewport (C12)', () => {
  it('a full-width Textarea does not push a horizontal scrollbar', { skip: !built }, async () => {
    const { Textarea } = components
    // A full-width container, which is what a real form is. A fixed narrow container hides
    // the defect: the ~34px overhang has to reach past the VIEWPORT edge to move
    // scrollWidth, so a 400px box inside a 1280px page overflows invisibly and the
    // assertion passes on broken CSS. Verified against a reset-stripped stylesheet.
    await mountBare(h('div', { style: { width: '100%' } }, h(Textarea, { rows: 3 })))
    const overflow = await page.evaluate(() => ({
      scrollWidth: document.documentElement.scrollWidth,
      clientWidth: document.documentElement.clientWidth,
    }))
    assert.equal(
      overflow.scrollWidth,
      overflow.clientWidth,
      'The document scrolls horizontally on a page containing nothing but a Textarea. ' +
        'That is the C12 signature: `width: 100%` + 32px inline padding + a 2px border ' +
        'computes 34px wider than its container without `box-sizing: border-box`, and the ' +
        'resulting horizontal scrollbar makes the document taller than the viewport, which ' +
        'produces a second, vertical scrollbar. Check that @cascivo/tokens/reset.css is ' +
        `inlined into styles.css (scrollWidth ${overflow.scrollWidth} vs clientWidth ${overflow.clientWidth}).`,
    )
  })

  it(
    'the reset really is in the shipped sheet (guards against a false pass)',
    { skip: !built },
    async () => {
      const boxSizing = await page.$eval(
        'textarea',
        (el: Element) => getComputedStyle(el).boxSizing,
      )
      assert.equal(
        boxSizing,
        'border-box',
        'Textarea computes box-sizing: ' +
          boxSizing +
          '. The assertion above could pass by ' +
          'accident (a narrow container, a scrollbar-less environment); this pins the cause.',
      )
    },
  )
})

describe('bare-page — a closed overlay swallows no clicks (C13)', () => {
  for (const name of ['MultiSelect', 'Sheet']) {
    it(`a closed ${name} does not cover the content beneath it`, { skip: !built }, async () => {
      const { Button } = components
      const Overlay = components[name]
      const overlayProps =
        name === 'MultiSelect'
          ? {
              options: [
                { value: 'a', label: 'Alpha' },
                { value: 'b', label: 'Beta' },
              ],
              value: [],
              onValueChange: () => {},
            }
          : { open: false, title: 'Closed sheet' }

      await mountBare(
        h('div', null, [
          h(Overlay, { key: 'o', ...overlayProps }),
          h(Button, { key: 'b', id: 'target' }, 'Click me'),
        ]),
      )

      const hit = await page.evaluate(() => {
        const button = document.querySelector('#target') as HTMLElement | null
        if (!button) return { ok: false, reason: 'target button not rendered' }
        const box = button.getBoundingClientRect()
        const el = document.elementFromPoint(box.x + box.width / 2, box.y + box.height / 2)
        return {
          ok: el === button || button.contains(el),
          reason: el ? `${el.tagName.toLowerCase()}.${el.className}` : 'nothing',
        }
      })

      assert.ok(
        hit.ok,
        `A closed ${name} is intercepting clicks meant for the button below it — ` +
          `elementFromPoint at the button's centre returned "${hit.reason}".\n` +
          'This is C13: the panel declares `display` in its base rule, which beats the ' +
          'UA-origin `[popover]:not(:popover-open) { display: none }`, so while closed it ' +
          'stays laid out — invisible at opacity 0, fixed-position, and hit-testable. ' +
          'Move `display` under `&:popover-open` (see popover-hidden.test.ts).',
      )
    })
  }
})

describe('bare-page — layout papercuts (C14, C15)', () => {
  it(
    'AppShell keeps its sidebar width under intrinsically wide content',
    { skip: !built },
    async () => {
      const { AppShell, SideNav } = components
      const nav = h(SideNav, { items: [{ id: 'a', label: 'Alpha', href: '#' }] })

      async function navWidth(child: unknown): Promise<number> {
        await mountBare(h(AppShell, { nav }, child), { width: 1700, height: 900 })
        return page.$eval(
          '[data-cascivo-appshell-nav]',
          (el: Element) => el.getBoundingClientRect().width,
        )
      }

      const narrow = await navWidth(h('p', null, 'short'))
      // An intrinsically wide, non-wrapping child — the shape that used to steal sidebar width.
      const wide = await navWidth(h('pre', { style: { whiteSpace: 'pre' } }, 'x'.repeat(400)))

      assert.equal(
        wide,
        narrow,
        `AppShell's sidebar is ${wide}px beside wide content and ${narrow}px beside narrow ` +
          'content, so pages render at different widths across an app (C14). The nav wrapper ' +
          'needs `flex-shrink: 0` — it has a fixed width by design, so it must never be the ' +
          'flex item that gives way.',
      )
    },
  )

  it('a Modal body spaces its children', { skip: !built }, async () => {
    const { Modal, Input } = components
    await mountBare(
      h(Modal, { open: true, title: 'Report' }, [
        h(Input, { key: 'a', label: 'Title' }),
        h(Input, { key: 'b', label: 'Owner' }),
      ]),
    )
    const gap = await page.$eval('[data-cascivo-modal-body]', (el: Element) => {
      const style = getComputedStyle(el)
      return { display: style.display, rowGap: style.rowGap }
    })
    assert.equal(
      gap.display,
      'flex',
      `Modal body computes display: ${gap.display}; it must be a flex column so its gap applies (C15).`,
    )
    assert.ok(
      gap.rowGap !== 'normal' && parseFloat(gap.rowGap) > 0,
      `Modal body has row-gap: ${gap.rowGap}, so stacked Fields render flush against each ` +
        'other — the obvious content for a dialog, looking broken by default (C15).',
    )
  })
})
