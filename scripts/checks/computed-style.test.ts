/**
 * Computed-style canary — the CSS facts no source-text guard can see.
 *
 * Two of the 2026-07-26 reports' defects were **computed-style** facts:
 *
 *  - `<Button asChild>` over an `<a>` rendered its label **underlined**, because nothing in
 *    the button rule set `text-decoration` and the browser's `a[href]` default survived. The
 *    adopter measured it side by side; every test in the repo passed.
 *  - `<Card padding="none">` put `CardHeader`'s title flush against the card edge, because
 *    the card and its subcomponents read one variable.
 *
 * Neither is visible to jsdom (no cascade, no UA stylesheet) or to a guard that greps the
 * stylesheet — `text-decoration: none` can be *present* and still lose to a later rule, and a
 * custom property's resolved value depends on the whole cascade. The only thing that sees
 * them is a real browser.
 *
 * So this renders the **real components** through `renderToStaticMarkup` (so the class names
 * are the ones CSS modules actually emit), loads the **shipped** `@cascivo/react/styles.css`,
 * and asserts `getComputedStyle` in headless Chromium. It runs against `dist/`, i.e. what an
 * adopter installs — not against source.
 *
 * Run with: `pnpm computed:check` (requires a prior `pnpm build`).
 */
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { strict as assert } from 'node:assert'
import { after, before, describe, it } from 'node:test'
import { createRequire } from 'node:module'
import { chromiumNote, resolveChromium } from './lib/chromium.ts'

// React, react-dom and Playwright are dependencies of `packages/react`, not of the repo root,
// so resolve them from there rather than adding root devDependencies for one check. Resolve
// with createRequire (for the lookup) but load with import() — `@cascivo/react/dist` is ESM.
const resolve = createRequire(new URL('../../packages/react/package.json', import.meta.url)).resolve
// CJS loaded through import() lands on `.default`; normalise so either shape works.
const load = async (specifier: string) => {
  const mod = await import(pathToFileURL(resolve(specifier)).href)
  return mod.default && !mod.chromium && !mod.createElement && !mod.renderToStaticMarkup
    ? mod.default
    : mod
}

/* eslint-disable @typescript-eslint/no-explicit-any -- dynamically loaded, see `load` above */
let chromium: any
let h: any
let renderToStaticMarkup: any
let Button: any
let Card: any
let CardContent: any
let CardHeader: any
let Link: any
let Stat: any
let AppShell: any
let Checkbox: any
let DataTable: any
let Field: any
let Grid: any
let GridItem: any
let Input: any
let SideNav: any

const ROOT = fileURLToPath(new URL('../..', import.meta.url))
const STYLES = readFileSync(join(ROOT, 'packages/react/dist/styles.css'), 'utf8')

let browser: any
let page: any

/** Render real components to HTML and mount them under a themed root in the browser. */
async function mount(node: unknown, theme = 'light', width = 640): Promise<void> {
  const html = renderToStaticMarkup(node as never)
  await page.setContent(
    `<!doctype html><html><head><style>${STYLES}</style></head>` +
      `<body><div data-theme="${theme}" id="root" style="inline-size:${width}px">${html}</div></body></html>`,
  )
}

/** Perceptual lightness distance between two `rgb()` strings, 0–100ish. */
function lightnessDelta(a: string, b: string): number {
  const parse = (c: string) => (c.match(/[\d.]+/g) ?? []).slice(0, 3).map(Number)
  const lum = (c: number[]) => 0.2126 * (c[0] ?? 0) + 0.7152 * (c[1] ?? 0) + 0.0722 * (c[2] ?? 0)
  return Math.abs(lum(parse(a)) - lum(parse(b)))
}

/** Computed value of one property on the first element matching `selector`. */
function computed(selector: string, property: string): Promise<string> {
  return page.$eval(
    selector,
    (el, prop) => getComputedStyle(el).getPropertyValue(prop as string),
    property,
  )
}

before(async () => {
  ;({ chromium } = await load('@playwright/test'))
  ;({ createElement: h } = await load('react'))
  ;({ renderToStaticMarkup } = await load('react-dom/server'))
  // The `node` condition entry — the CSS-free server build. The default entry imports its
  // per-component `.css` side effects, which a bare Node loader cannot resolve (the exact
  // failure documented in docs/USING-WITH-VITE-SSR.md). The stylesheet is loaded separately,
  // exactly as a browser does.
  ;({
    AppShell,
    Button,
    Card,
    CardContent,
    CardHeader,
    Checkbox,
    DataTable,
    Field,
    Grid,
    GridItem,
    Input,
    Link,
    SideNav,
    Stat,
  } = await import(new URL('../../packages/react/dist/node/index.js', import.meta.url).href))
  // Playwright pins an exact Chromium build and refuses to launch anything else, so a dev
  // container whose image ships a different build fails here with "Executable doesn't exist
  // at …/chromium-<rev>/…" — which is what made `pnpm ready` unrunnable outside CI until the
  // developer discovered CASCIVO_CHROMIUM. `resolveChromium` finds an installed Chromium
  // under PLAYWRIGHT_BROWSERS_PATH instead; the assertions here are `box-sizing`,
  // `text-decoration` and custom-property resolution, none of which is build-specific.
  const executablePath = resolveChromium(chromium.executablePath())
  console.log(chromiumNote(executablePath))
  // Still deliberately NOT wrapped in a try/skip. A canary that passes when it could not run
  // is worse than no canary — that shape is what let `@cascivo/core` slip past npm-parity and
  // what let a green suite ship an underlined button. Discovery substitutes a REAL browser;
  // when none exists this still fails loudly and CI installs the pinned one.
  browser = await chromium.launch(executablePath ? { executablePath } : {})
  page = await browser.newPage()
})

after(async () => {
  await browser?.close()
})

describe('asChild controls do not inherit anchor chrome', () => {
  it('a Button rendered as an <a> is not underlined', async () => {
    await mount(
      h('div', null, [
        h(Button, { key: 'b' }, 'Real button'),
        h(
          Button,
          { key: 'a', asChild: true },
          h('a', { href: '/projects', id: 'as-anchor' }, 'Link button'),
        ),
      ]),
    )
    const decoration = await computed('#as-anchor', 'text-decoration-line')
    assert.equal(
      decoration,
      'none',
      'A `<Button asChild>` over an <a> must not render underlined — `asChild` exists so the ' +
        "styling lands on a real anchor, and the UA's a[href] underline undoes that.",
    )
  })

  it('the asChild anchor matches the real <button> on background and colour', async () => {
    await mount(
      h('div', null, [
        h(Button, { key: 'b', id: 'real' } as never, 'Real button'),
        h(Button, { key: 'a', asChild: true }, h('a', { href: '/x', id: 'anchor' }, 'Link button')),
      ]),
    )
    for (const property of ['background-color', 'color']) {
      assert.equal(
        await computed('#anchor', property),
        await computed('#real', property),
        `asChild anchor and real <button> must resolve the same \`${property}\``,
      )
    }
  })

  it('aria-disabled on an asChild anchor dims it like :disabled', async () => {
    await mount(
      h('div', null, [
        h(Button, { key: 'd', disabled: true, id: 'real-disabled' } as never, 'Disabled'),
        h(
          Button,
          { key: 'a', asChild: true },
          h('a', { href: '/x', id: 'anchor-disabled', 'aria-disabled': 'true' }, 'Disabled link'),
        ),
      ]),
    )
    assert.equal(
      await computed('#anchor-disabled', 'opacity'),
      await computed('#real-disabled', 'opacity'),
      'An <a> can never match :disabled, so aria-disabled must carry the same visuals',
    )
  })

  it('a Link rendered asChild still gets cascivo link styling', async () => {
    await mount(h(Link, { asChild: true }, h('a', { href: '/p', id: 'router-link' }, 'Project')))
    const color = await computed('#router-link', 'color')
    assert.notEqual(color, 'rgb(0, 0, 238)', 'must not be the UA default link blue')
    assert.match(color, /^(rgb|oklch|color)/, `expected a resolved colour, got "${color}"`)
  })
})

describe('Card padding composes with its subcomponents', () => {
  it('padding="none" lets a flush child reach the edge without stripping header padding', async () => {
    await mount(
      h(Card, { padding: 'none' }, [
        h(CardHeader, { key: 'h', id: 'header' } as never, 'Build log'),
        h(CardContent, { key: 'c', id: 'content' } as never, 'flush body'),
      ]),
    )
    assert.equal(
      await computed('#root > *', 'padding-top'),
      '0px',
      'padding="none" must leave the card box itself unpadded — that is what it is for',
    )
    const headerPad = await computed('#header', 'padding-left')
    assert.notEqual(
      headerPad,
      '0px',
      'CardHeader must keep its own padding under padding="none" — zeroing it put the title ' +
        'flush against the card border and made the mode unusable with the composition it holds',
    )
  })

  it('padding="md" does not double up on its subcomponents', async () => {
    await mount(
      h(Card, { padding: 'md' }, [
        h(CardHeader, { key: 'h', id: 'header' } as never, 'Title'),
        h(CardContent, { key: 'c', id: 'content' } as never, 'Body'),
      ]),
    )
    const card = Number.parseFloat(await computed('#root > *', 'padding-left'))
    const header = Number.parseFloat(await computed('#header', 'padding-left'))
    assert.ok(
      card === 0 || header === 0,
      `Card and CardHeader both padded (${card}px + ${header}px): the header's content sits ` +
        `${card + header}px from the card border. Exactly one of the two owns the inset.`,
    )
  })
})

describe('Stat and Kpi read as one system', () => {
  it('Stat is layout-only by default and gains card chrome with `card`', async () => {
    await mount(h(Stat, { label: 'Requests', value: '81.3K', id: 'plain' } as never))
    assert.equal(
      await computed('#plain', 'border-top-width'),
      '0px',
      'Stat must stay layout-only by default so it can sit inside a Card the app controls',
    )

    await mount(h(Stat, { label: 'Requests', value: '81.3K', card: true, id: 'carded' } as never))
    assert.notEqual(
      await computed('#carded', 'border-top-width'),
      '0px',
      '`<Stat card>` must ship the same chrome as Kpi so a mixed dashboard reads as one system',
    )
  })
})

/*
 * Three defects an adopter can only see in a real browser, all reported 2026-08-08 (report A).
 * None is expressible in jsdom: two are about hit-testing, one about a containing block.
 */
describe('Card establishes a containing block', () => {
  it('a stretched link inside a Card does not cover the page', async () => {
    await mount(
      h('div', { id: 'page', style: { position: 'relative', blockSize: '600px' } }, [
        h(
          'button',
          { key: 'b', id: 'outside', style: { position: 'absolute', top: '400px' } },
          'Nav',
        ),
        h(Card, { key: 'c' }, h('a', { href: '#x', id: 'stretched' }, 'Open project')),
      ]),
    )
    // The stretched-link idiom: an ::after overlay filling the nearest positioned ancestor.
    await page.addStyleTag({
      content: '#stretched::after { content: ""; position: absolute; inset: 0; }',
    })
    const hit = await page.$eval('#outside', (el: Element) => {
      const r = el.getBoundingClientRect()
      const top = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2)
      return top?.id ?? top?.tagName ?? '?'
    })
    assert.equal(
      hit,
      'outside',
      'A stretched link inside a Card resolved its overlay against the VIEWPORT and swallowed ' +
        'every click on the page. Card must be `position: relative`.',
    )
  })
})

describe('AppShell insets its content', () => {
  it('main has padding by default', async () => {
    await mount(h(AppShell, { header: h('div', null, 'Header') } as never, 'Body'))
    const pad = await computed('#cascade-main', 'padding-top')
    assert.notEqual(
      pad,
      '0px',
      'AppShell main shipped `padding: 0` for three releases, so every adopter wrote the same ' +
        'wrapper div and every first screenshot had clipped buttons.',
    )
  })

  it('padding="none" opts out for full-bleed layouts', async () => {
    await mount(h(AppShell, { header: h('div', null, 'Header'), padding: 'none' } as never, 'Body'))
    assert.equal(await computed('#cascade-main', 'padding-top'), '0px')
  })
})

describe('SideNav slots share one padding context', () => {
  const items = [
    { id: 'projects', label: 'Projects', href: '/projects' },
    { id: 'deployments', label: 'Deployments', href: '/deployments' },
  ]

  /*
   * `.footer` shipped `padding-block` and no `padding-inline` while `.header` and
   * `.customItem` carried both, so a footer rendered flush against the rail's edge while
   * every nav item above it was inset (2026-08-21 report item 6). Invisible to jsdom and to
   * any grep of the stylesheet — the declaration was not wrong, it was absent.
   *
   * Asserted as equality with `header`, never against a literal: a future token change must
   * be free to move both, and must not be able to move only one.
   */
  it('footer is inset exactly like header', async () => {
    await mount(h(SideNav, { items, header: 'Acme Inc', footer: 'Hobby plan · fra1' } as never))
    const [header, footer] = await page.evaluate(() => {
      const read = (selector: string) => {
        const el = document.querySelector(selector)
        if (!el) throw new Error(`SideNav rendered no ${selector}`)
        return getComputedStyle(el).paddingInlineStart
      }
      return [read('[class*="header"]'), read('[class*="footer"]')]
    })
    assert.notEqual(
      header,
      '0px',
      'SideNav header lost its inline padding — the fixture no longer proves anything.',
    )
    assert.equal(
      footer,
      header,
      `SideNav footer is inset ${footer} against the header's ${header}. The footer must sit ` +
        'in the same padding context as the header and the items, or stock content ("Hobby ' +
        'plan · fra1") renders flush against the rail edge in every theme.',
    )
  })
})

describe('AppShell and SideNav rail collapse compose (2026-08-31 report §14)', () => {
  const items = [
    { id: 'projects', label: 'Projects', href: '/projects' },
    { id: 'deployments', label: 'Deployments', href: '/deployments' },
  ]

  /*
   * `AppShellProps` promises the two never fight: AppShell owns the full show/hide, the
   * SideNav it is handed owns its own rail. They fought, and AppShell won — `.navInner` was
   * pinned to the shell's aside width and `.navInner > * { flex: 1 1 auto }` stretched a
   * collapsed 4rem nav back to 18rem. The adopter measured 288 -> 288 across the collapse and
   * had to retune `--cascivo-shell-aside-inline-size` by hand to get a usable rail.
   *
   * Only a real browser sees this: the rule that loses is present and correct in the
   * stylesheet, and jsdom resolves no widths at all.
   */
  async function navWidth(collapsed: boolean): Promise<number> {
    await mount(
      h(
        AppShell,
        { header: h('div', null, 'Header'), nav: h(SideNav, { items, collapsed }) } as never,
        'Body',
      ),
      'light',
      1280,
    )
    return page.evaluate(() => {
      const nav = document.querySelector('nav')
      if (!nav) throw new Error('AppShell rendered no nav')
      // The shell column, not the nav itself: the nav shrank correctly all along; the
      // column around it did not.
      const column = nav.parentElement?.parentElement
      if (!column) throw new Error('AppShell rendered no nav column')
      return column.getBoundingClientRect().width
    })
  }

  it('the shell column follows the nav onto the rail', async () => {
    const expanded = await navWidth(false)
    const collapsed = await navWidth(true)
    assert.ok(
      expanded > 200,
      `expanded shell column measured ${expanded}px — the fixture is not laying out at all`,
    )
    assert.ok(
      collapsed < expanded / 2,
      `AppShell's nav column measured ${expanded}px expanded and ${collapsed}px collapsed. The ` +
        'column must follow the rail, or the collapse toggle shrinks the icons and leaves them ' +
        'floating in an 18rem gutter — which is what makes the control look inert.',
    )
  })

  /* §17: at 4rem an uppercase, letter-spaced group heading renders clipped mid-word. */
  it('group headings are not painted on the rail', async () => {
    await mount(
      h(SideNav, { groups: [{ id: 'team', label: 'TEAM', items }], collapsed: true } as never),
    )
    const visibility = await page.evaluate(() => {
      const heading = document.querySelector('nav h3')
      if (!heading) throw new Error('SideNav rendered no group heading')
      return getComputedStyle(heading).visibility
    })
    assert.equal(
      visibility,
      'hidden',
      'A group heading must not paint on the 4rem rail — it clips mid-word. It stays in the ' +
        'a11y tree (visibility, not removal) so it keeps naming its group.',
    )
  })

  it('the same heading is legible once the nav is expanded', async () => {
    await mount(h(SideNav, { groups: [{ id: 'team', label: 'TEAM', items }] } as never))
    const visibility = await page.evaluate(
      () => getComputedStyle(document.querySelector('nav h3') as Element).visibility,
    )
    assert.equal(visibility, 'visible')
  })
})

describe('Checkbox decoration does not intercept pointer events', () => {
  it('hit-testing the control resolves to the input or its label', async () => {
    await mount(h(Checkbox, { label: 'Select row', id: 'cb' } as never))
    const tag = await page.evaluate(() => {
      const control = document.querySelector('[class*="control"]') as HTMLElement
      const r = control.getBoundingClientRect()
      const top = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2)
      return top?.tagName ?? '?'
    })
    assert.ok(
      tag === 'INPUT' || tag === 'LABEL',
      `Hit-testing the checkbox control resolved to <${tag}>. The visually-hidden <input> sits ` +
        'beneath the decoration, so every Playwright .check() in every adopter suite fails ' +
        'with "intercepts pointer events" and needs { force: true }.',
    )
  })
})

/*
 * The four items the 2026-08-08 plan listed as UNVERIFIED.
 *
 * Speccing a fix for an unreproduced defect is how the 07-28 `@types/react` item cost two
 * plans, so each of these is a probe first. Whatever they report is the finding — including
 * "the reporter's impression was wrong", which is a legitimate and useful outcome.
 */
describe('WS-8 — reported but unreproduced', () => {
  const rows = Array.from({ length: 6 }, (_, i) => ({ id: `r${i}`, name: `Row ${i}` }))
  const columns = [{ key: 'name', header: 'Name' }]

  for (const theme of ['light', 'dark', 'warm']) {
    it(`DataTable zebra striping is perceptible in the ${theme} theme`, async () => {
      await mount(
        h(DataTable, {
          columns,
          rows,
          getRowId: (r: { id: string }) => r.id,
          zebra: true,
        } as never),
        theme,
      )
      // Striped rows set `--cascivo-color-bg-subtle`; unstriped rows are TRANSPARENT and show
      // the surface beneath. So the comparison that matters is subtle-vs-surface, not the two
      // computed backgrounds (one of which is rgba(0,0,0,0) and carries no colour at all).
      //
      // Both tokens are authored in OKLCH, whose first component IS perceptual lightness —
      // so the difference in that component is the honest measure, and a naive rgb() parse of
      // an `oklch()` string is not.
      // Composite the striped row over the surface it sits on and compare real pixels — a
      // translucent stripe has no meaningful `background-color` of its own, and comparing
      // the two computed values is exactly the mistake that hid this for so long.
      const alpha = await page.evaluate(() => {
        const striped = document.querySelectorAll('tbody tr')[1]!
        const bg = getComputedStyle(striped).backgroundColor
        const m = bg.match(/[\d.]+/g) ?? []
        return m.length === 4 ? Number(m[3]) : bg === 'rgba(0, 0, 0, 0)' ? 0 : 1
      })
      assert.ok(
        alpha > 0.02,
        `The striped row paints at alpha ${alpha} in ${theme}, so it is invisible against ` +
          'whatever it sits on. `--cascivo-color-bg-subtle` is aliased to ' +
          '`--cascivo-color-surface` in every theme, so using it to stripe a table on a ' +
          'surface painted each row the colour it already was.',
      )
    })
  }

  it('an icon followed by text in a Button gets a gap', async () => {
    await mount(
      h('div', null, [
        h(Button, { key: 'a', id: 'with-svg' }, [
          h('svg', { key: 's', width: 16, height: 16 }),
          'Visit',
        ]),
      ]),
    )
    const gap = await page.evaluate(() => {
      const svg = document.querySelector('#with-svg svg')!
      const r = svg.getBoundingClientRect()
      const host = svg.parentElement!
      // Distance from the icon's right edge to the first text glyph.
      const range = document.createRange()
      const textNode = [...host.childNodes].find((n) => n.nodeType === 3)
      if (!textNode) return -1
      range.selectNodeContents(textNode)
      return range.getBoundingClientRect().left - r.right
    })
    assert.ok(
      gap === -1 || gap >= 2,
      `Icon and text are ${gap.toFixed(2)}px apart — they render touching. A Button composing ` +
        'an icon with a label must space them without the adopter writing CSS against the ' +
        'internal DOM shape.',
    )
  })

  it('Fields in a Grid row keep their inputs aligned when one has a description', async () => {
    /*
     * Reported as "needs manual work" (2026-08-08 report B), and the cause was not the one
     * it looked like. `Field` renders label → control → description, so the description sits
     * BELOW the input and cannot push it down. The real cause was `.field` being a grid with
     * the default `align-content: stretch`: as a cell in a Grid row taller than its own
     * content, its rows absorbed the slack, and a field with three rows distributed it
     * differently from a field with two. The inputs drifted 13.6px apart for reasons nothing
     * to do with their content. `align-content: start` pins the rows to their natural sizes.
     */
    await mount(
      h(Grid, { cols: 2, gap: 4 } as never, [
        h(
          Field,
          { key: 'a', label: 'Name', description: 'Shown publicly' } as never,
          h(Input, {} as never),
        ),
        h(Field, { key: 'b', label: 'Slug' } as never, h(Input, {} as never)),
      ]),
      'light',
      1024,
    )
    // `Field` clones its child with a generated id, so the inputs cannot be selected by an id
    // passed in — take them in document order instead.
    const [a, b] = await page.evaluate(() =>
      [...document.querySelectorAll('input')].map((i) => i.getBoundingClientRect().top),
    )
    assert.ok(
      Math.abs(a! - b!) <= 1,
      `Inputs sit ${Math.abs(a! - b!).toFixed(1)}px apart vertically. A description on one ` +
        'Field must not move its input relative to its neighbour — the description renders ' +
        "below the control, so any offset is the field's own rows absorbing grid slack.",
    )
  })

  it('a Card in a spanning GridItem fills the row height', async () => {
    await mount(
      h(Grid, { cols: 3, gap: 4 } as never, [
        h(GridItem, { key: 'a', span: 2 } as never, h(Card, { id: 'short' }, 'short')),
        h(
          GridItem,
          { key: 'b' } as never,
          h(Card, { id: 'tall' }, h('div', { style: { blockSize: '200px' } }, 'tall')),
        ),
      ]),
      'light',
      1024,
    )
    const [short, tall] = await page.evaluate(() => [
      document.querySelector('#short')!.getBoundingClientRect().height,
      document.querySelector('#tall')!.getBoundingClientRect().height,
    ])
    assert.ok(
      short >= tall - 1,
      `The spanning Card is ${short.toFixed(0)}px tall next to a ${tall.toFixed(0)}px sibling, ` +
        'leaving a visible hole in the row.',
    )
  })
})

/*
 * DataTable's scrolling shadows — both halves of the contract.
 *
 * The shadows are the only thing that says a table is cut off at its inline edge, and they
 * are made of four background layers whose alignment is a LAYOUT fact, not a source fact:
 * the covers are placed against the scrollable overflow area (`local`), the shadows against
 * the padding box (`scroll`). Nothing that greps the stylesheet can see whether those two
 * boxes still coincide — and while a `scrollbar-gutter: stable` held them apart, every table
 * that FIT painted a right-edge shadow for a column that was not there, with the stylesheet
 * still reading as correct (landing-page review, 2026-09, item 02).
 *
 * So this measures pixels, and it measures DISTANCE from the interior rather than darkness:
 * the shadow is ink on cream in the light themes and light on ink in the dark one, so "is
 * the edge darker" is only half the catalogue. Cell values are deliberately empty — the
 * probe is a one-pixel scanline through the middle of a row, and a glyph in the way would be
 * indistinguishable from a shadow.
 */
describe('DataTable scrolling shadows', () => {
  const columns = [
    { key: 'deployment', header: 'Deployment identifier' },
    { key: 'status', header: 'Status' },
    { key: 'duration', header: 'Duration' },
  ]
  const rows = Array.from({ length: 4 }, (_, i) => ({
    id: `r${i}`,
    deployment: '',
    status: '',
    duration: '',
  }))

  /** How far the edge bands stray from the clean interior, in luminance. */
  const SHADOW = 8

  const probe = () =>
    h(DataTable, {
      columns,
      rows,
      getRowId: (r: { id: string }) => r.id,
      ariaLabel: 'Deployments',
    } as never)

  /**
   * Luminance along one horizontal scanline through the scroller, taken at the vertical
   * middle of the second body row so no row divider crosses it.
   */
  async function scanline(scrollLeft?: number | 'max'): Promise<number[]> {
    const clip = await page.evaluate((sl: number | 'max' | undefined) => {
      const el = document.querySelector('[class*="scroller"]') as HTMLElement
      if (sl !== undefined) el.scrollLeft = sl === 'max' ? el.scrollWidth : sl
      const row = el.querySelectorAll('tbody tr')[1]!.getBoundingClientRect()
      const box = el.getBoundingClientRect()
      return {
        x: Math.round(box.x),
        y: Math.round(row.y + row.height / 2),
        width: Math.round(box.width),
        height: 1,
      }
    }, scrollLeft)
    const shot = await page.screenshot({ clip })
    return page.evaluate(async (b64: string) => {
      const img = new Image()
      img.src = `data:image/png;base64,${b64}`
      await img.decode()
      const canvas = document.createElement('canvas')
      canvas.width = img.width
      canvas.height = 1
      const ctx = canvas.getContext('2d')!
      ctx.drawImage(img, 0, 0)
      const px = ctx.getImageData(0, 0, img.width, 1).data
      return [...Array(img.width).keys()].map(
        (i) => (px[i * 4]! * 0.2126 + px[i * 4 + 1]! * 0.7152 + px[i * 4 + 2]! * 0.0722) | 0,
      )
    }, shot.toString('base64'))
  }

  /** Widest departure from the interior within `band` px of each edge, either direction. */
  function edges(line: number[], band = 16): { left: number; right: number } {
    const interior = line.slice(band * 4, -band * 4)
    const mid = interior.reduce((a, b) => a + b, 0) / interior.length
    const stray = (px: number[]) => Math.max(...px.map((v) => Math.abs(v - mid)))
    return { left: stray(line.slice(0, band)), right: stray(line.slice(-band)) }
  }

  for (const theme of ['light', 'dark', 'warm']) {
    it(`a table that fits paints no edge shadow in the ${theme} theme`, async () => {
      await mount(probe(), theme, 640)
      const fits = await page.$eval(
        '[class*="scroller"]',
        (el: HTMLElement) => el.scrollWidth <= el.clientWidth,
      )
      assert.ok(fits, 'The probe table was meant to fit its container; widen the mount.')
      const { left, right } = edges(await scanline())
      assert.ok(
        left < SHADOW && right < SHADOW,
        `A table with nothing to scroll to strays from its own interior by ${left} on the ` +
          `left and ${right} on the right. The scrolling shadows may only appear when there ` +
          'is more table to reach: anything that reserves inline space inside the scroller ' +
          'pushes the `scroll` shadow clear of the `local` cover that hides it, and the ' +
          'shadow becomes a phantom column edge on every table in the catalogue.',
      )
    })
  }

  it('a table that overflows marks the side there is more to reach', async () => {
    await mount(probe(), 'light', 220)
    const overflows = await page.$eval(
      '[class*="scroller"]',
      (el: HTMLElement) => el.scrollWidth > el.clientWidth,
    )
    assert.ok(overflows, 'The probe table was meant to overflow its container; narrow the mount.')

    const start = edges(await scanline(0))
    assert.ok(
      start.right >= SHADOW && start.left < SHADOW,
      `Scrolled to the start the edges stray by ${start.left} (left) and ${start.right} ` +
        '(right). There is more table to the right and only that side may say so.',
    )

    const end = edges(await scanline('max'))
    assert.ok(
      end.left >= SHADOW && end.right < SHADOW,
      `Scrolled to the end the edges stray by ${end.left} (left) and ${end.right} (right). ` +
        'The table scrolled past is to the left and only that side may say so.',
    )
  })
})
