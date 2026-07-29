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

const ROOT = fileURLToPath(new URL('../..', import.meta.url))
const STYLES = readFileSync(join(ROOT, 'packages/react/dist/styles.css'), 'utf8')

let browser: any
let page: any

/** Render real components to HTML and mount them under a themed root in the browser. */
async function mount(node: unknown): Promise<void> {
  const html = renderToStaticMarkup(node as never)
  await page.setContent(
    `<!doctype html><html><head><style>${STYLES}</style></head>` +
      `<body><div data-theme="light" id="root" style="inline-size:640px">${html}</div></body></html>`,
  )
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
  ;({ Button, Card, CardContent, CardHeader, Link, Stat } = await import(
    new URL('../../packages/react/dist/node/index.js', import.meta.url).href
  ))
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
