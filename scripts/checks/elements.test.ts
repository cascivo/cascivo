/**
 * `@cascivo/elements` pilot gate (Rust + HTML-first plan, W2; kill criteria 2 and 3).
 *
 * Two legs over the BUILT `packages/elements/dist`:
 *
 * **Size** — gzip per element ≤ 3 KB and per pilot page ≤ 15 KB. "Per element" is what adding
 * that element to a page costs: its entry plus every chunk only it reaches. Chunks two or more
 * entries share (signals-core, the i18n core, the base classes) are the runtime, paid once
 * per page and counted in the page total.
 *
 * **Browser** — real Chromium, the pilot page (`packages/elements/test/pilot.ts`, the markup
 * the React components render) with the shipped `elements.css`: behaviour and keyboard per
 * the WAI-ARIA APG, form association, axe (WCAG 2.2 AA), the 320/360/390/414 overflow and
 * ≥44px coarse-target sweep, and survival of an idiomorph morph back to the server markup.
 *
 * Requires `pnpm build`. Never skips: a gate that passes when it could not run is no gate.
 */
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { join } from 'node:path'
import { after, before, describe, it } from 'node:test'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { gzipSync } from 'node:zlib'
import { buildBase, buildTheme } from '../html-kit/build-css.ts'
import { chromiumNote, resolveChromium } from './lib/chromium.ts'
import { PILOT } from '../../packages/elements/test/pilot.ts'

const PKG = fileURLToPath(new URL('../../packages/elements/', import.meta.url))
const DIST = join(PKG, 'dist')
const ELEMENTS = ['menu', 'tabs', 'form', 'combobox', 'date-picker'] as const
const ELEMENT_BUDGET = 3 * 1024
/** `cv-tabs` is the smallest element; its contract budget (phase-1-contract-plan §6) is 0.8 KB. */
const BUDGET: Record<string, number> = { tabs: 819 }
const PAGE_BUDGET = 15 * 1024
const require = createRequire(join(PKG, 'package.json'))

const read = (f: string) => readFileSync(join(DIST, f))
const gz = (f: string) => gzipSync(read(f)).length

/** Every dist file reachable from `entry` by static import, including itself. */
function closure(entry: string): Set<string> {
  const seen = new Set<string>()
  const queue = [entry]
  while (queue.length > 0) {
    const f = queue.shift()!
    if (seen.has(f)) continue
    seen.add(f)
    for (const m of read(f)
      .toString()
      .matchAll(/from\s*["']\.\/([^"']+)["']/g))
      queue.push(m[1]!)
  }
  return seen
}

describe('@cascivo/elements size budget', () => {
  const closures = new Map(ELEMENTS.map((e) => [e, closure(`${e}.js`)]))
  const reach = (f: string) => [...closures.values()].filter((c) => c.has(f)).length
  const sizes: Record<string, number> = {}

  for (const el of ELEMENTS) {
    it(`${el}: own code ≤ ${el === 'tabs' ? '0.8' : '3'} KB gz`, () => {
      const own = [...closures.get(el)!].filter((f) => reach(f) === 1)
      const total = own.reduce((n, f) => n + gz(f), 0)
      sizes[el] = total
      const budget = BUDGET[el] ?? ELEMENT_BUDGET
      assert.ok(total <= budget, `${el}: ${total} B gz (${own.join(', ')}) > ${budget}`)
    })
  }

  it('pilot page (all four + runtime) ≤ 15 KB gz', () => {
    const all = new Set(ELEMENTS.flatMap((e) => [...closures.get(e)!]))
    const runtime = [...all].filter((f) => reach(f) > 1)
    const total = [...all].reduce((n, f) => n + gz(f), 0)
    const css = gzipSync(read('elements.css')).length
    console.log(
      `elements gz: ${JSON.stringify(sizes)} runtime=${runtime.reduce((n, f) => n + gz(f), 0)} ` +
        `page-js=${total} elements.css=${css}`,
    )
    assert.ok(total <= PAGE_BUDGET, `page: ${total} B gz > ${PAGE_BUDGET}`)
  })
})

describe('@cascivo/elements in Chromium', () => {
  let browser: any
  const ORIGIN = 'http://elements.test/'
  const STYLE = [buildBase(), buildTheme('light'), read('elements.css').toString()].join('\n')
  const PAGE = `<!doctype html><html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1"><title>Elements pilot</title>
<style>${STYLE} body{padding:16px;display:grid;gap:16px}</style>
<script src="/idiomorph.js"></script>
<script type="module">
  import { define as menu } from '/menu.js'
  import { define as tabs } from '/tabs.js'
  import { define as combobox } from '/combobox.js'
  import { define as datePicker } from '/date-picker.js'
  window.events = []
  for (const type of ['cv-select', 'cv-value-change', 'input', 'change'])
    document.addEventListener(type, (e) => events.push({ type, target: e.target.id, detail: e.detail }))
  menu(); menu(); tabs(); combobox(); datePicker()
  window.ready = true
</script></head><body><main>${PILOT}</main></body></html>`

  const files: Record<string, () => string | Buffer> = {
    'idiomorph.js': () => readFileSync(require.resolve('idiomorph/dist/idiomorph.js')),
    'axe.js': () => readFileSync(require.resolve('axe-core/axe.min.js')),
  }

  async function open(options: Record<string, unknown> = {}) {
    const context = await browser.newContext(options)
    const page = await context.newPage()
    // A stuck step should fail by name, not hang the whole gate.
    page.setDefaultTimeout(5000)
    await page.route(`${ORIGIN}**`, (route: any) => {
      const name = new URL(route.request().url()).pathname.slice(1)
      const body = name === '' ? PAGE : (files[name]?.() ?? read(name))
      const type = name === '' ? 'text/html' : 'text/javascript'
      return route.fulfill({ body, contentType: type })
    })
    await page.goto(ORIGIN)
    await page.waitForFunction(() => (window as any).ready === true)
    return { page, close: () => context.close() }
  }

  const attr = (page: any, sel: string, name: string) =>
    page.$eval(sel, (el: Element, n: string) => el.getAttribute(n), name)
  const focused = (page: any) =>
    page.evaluate(
      () => (document.activeElement as HTMLElement).dataset['value'] ?? document.activeElement?.id,
    )
  const formData = (page: any) =>
    page.evaluate(() =>
      Object.fromEntries(new FormData(document.getElementById('pilot') as HTMLFormElement)),
    )
  /** The calendar takes focus one task after opening (its popup fades in from hidden). */
  const opened = (page: any) =>
    page.waitForFunction(
      () => (document.activeElement as HTMLElement | null)?.dataset['day'],
      null,
      {
        timeout: 2000,
      },
    )
  const tick = (page: any) => page.evaluate(() => new Promise((r) => setTimeout(r, 0)))

  before(async () => {
    // CJS through import() lands on `.default`.
    const mod = await import(pathToFileURL(require.resolve('playwright')).href)
    const { chromium } = mod.default ?? mod
    const executablePath = resolveChromium(chromium.executablePath())
    console.log(chromiumNote(executablePath))
    browser = await chromium.launch(executablePath ? { executablePath } : {})
  })
  after(() => browser?.close())

  it('cv-menu: APG menu button keyboard, cv-select, light dismiss', async () => {
    const { page, close } = await open()
    const trigger = '#actions [aria-haspopup]'
    await page.focus(trigger)
    await page.keyboard.press('Enter')
    assert.equal(await attr(page, trigger, 'aria-expanded'), 'true')
    assert.ok(
      await page.$eval('#actions [role=menu]', (el: Element) => el.matches(':popover-open')),
    )
    assert.equal(await focused(page), 'edit', 'opening focuses the first item')
    await page.keyboard.press('ArrowDown')
    assert.equal(await focused(page), 'duplicate')
    await page.keyboard.press('ArrowDown')
    assert.equal(await focused(page), 'delete', 'disabled item and separator are skipped')
    await page.keyboard.press('ArrowDown')
    assert.equal(await focused(page), 'edit', 'wraps')
    await page.keyboard.press('End')
    assert.equal(await focused(page), 'delete')
    await page.keyboard.press('Home')
    await page.keyboard.press('d')
    assert.equal(await focused(page), 'duplicate', 'typeahead')
    await page.keyboard.press('Escape')
    assert.equal(await attr(page, trigger, 'aria-expanded'), 'false')
    assert.equal(
      await page.evaluate(() => document.activeElement?.matches('[aria-haspopup]')),
      true,
    )
    await page.click(trigger)
    await page.click('[data-value=delete]')
    const events = await page.evaluate(() => (window as any).events)
    assert.deepEqual(events.at(-1), {
      type: 'cv-select',
      target: 'actions',
      detail: { value: 'delete' },
    })
    assert.equal(await attr(page, trigger, 'aria-expanded'), 'false')
    await page.click(trigger)
    await page.mouse.click(300, 700)
    // Light dismiss reports back through the popover's `toggle` event, a task later.
    await page.waitForFunction(
      (sel: string) => document.querySelector(sel)?.getAttribute('aria-expanded') === 'false',
      trigger,
    )
    await close()
  })

  it('cv-tabs: APG tabs keyboard, cv-value-change, roving tabindex', async () => {
    const { page, close } = await open()
    const tabId = (id: string) => `#plan-trigger-${id}`
    const shown = () =>
      page.$$eval('#plan [role=tabpanel]', (els: HTMLElement[]) =>
        els.filter((e) => !e.hidden).map((e) => e.id),
      )
    assert.deepEqual(await shown(), ['plan-content-overview'])
    await page.focus(tabId('overview'))
    await page.keyboard.press('ArrowRight')
    assert.equal(await attr(page, tabId('details'), 'aria-selected'), 'true', 'arrows activate')
    assert.equal(await attr(page, tabId('details'), 'tabindex'), '0')
    assert.equal(await attr(page, tabId('overview'), 'tabindex'), '-1')
    assert.deepEqual(await shown(), ['plan-content-details'])
    await page.keyboard.press('ArrowRight')
    assert.equal(
      await page.evaluate(() => document.activeElement?.id),
      'plan-trigger-history',
      'disabled tab skipped',
    )
    await page.keyboard.press('ArrowRight')
    assert.equal(await page.evaluate(() => document.activeElement?.id), 'plan-trigger-overview')
    await page.keyboard.press('End')
    assert.equal(await page.evaluate(() => document.activeElement?.id), 'plan-trigger-history')
    await page.keyboard.press('Home')
    assert.equal(await attr(page, tabId('overview'), 'aria-selected'), 'true')
    await page.keyboard.press('Tab')
    assert.equal(
      await page.evaluate(() => document.activeElement?.getAttribute('role')),
      'tabpanel',
      'Tab leaves the tablist for the panel',
    )
    await page.click(tabId('history'))
    assert.deepEqual(await shown(), ['plan-content-history'])
    const events = (await page.evaluate(() => (window as any).events)).filter(
      (e: any) => e.type === 'cv-value-change' && e.target === 'plan',
    )
    assert.deepEqual(events.at(-1).detail, { value: 'history' })
    await close()
  })

  it('cv-combobox: APG editable combobox, filtering, form value, events, reset', async () => {
    const { page, close } = await open()
    const input = '#fruit-input'
    assert.equal(await page.$eval(input, (el: HTMLInputElement) => el.value), 'Apple')
    assert.deepEqual((await formData(page))['fruit'], 'apple')
    await page.focus(input)
    await page.keyboard.press('ArrowDown')
    assert.equal(await attr(page, input, 'aria-expanded'), 'true')
    const active = () => attr(page, input, 'aria-activedescendant')
    assert.equal(
      await page.$eval(`#${await active()}`, (el: HTMLElement) => el.dataset['value']),
      'apple',
    )
    await page.keyboard.press('ArrowDown')
    assert.equal(
      await page.$eval(`#${await active()}`, (el: HTMLElement) => el.dataset['value']),
      'banana',
    )
    await page.keyboard.press('Escape')
    assert.equal(await attr(page, input, 'aria-expanded'), 'false')
    assert.equal(
      await page.$eval(input, (el: HTMLInputElement) => el.value),
      'Apple',
      'Escape keeps value',
    )

    await page.keyboard.press('ControlOrMeta+a')
    await page.keyboard.type('b')
    const visible = await page.$$eval('#fruit [role=option]:not([hidden])', (els: HTMLElement[]) =>
      els.map((e) => e.dataset['value']),
    )
    assert.deepEqual(visible, ['banana', 'blueberry'])
    assert.equal(
      await page.$eval('#fruit [aria-live]', (el: Element) => el.textContent),
      '2 options available',
    )
    await page.keyboard.press('ArrowDown')
    await page.keyboard.press('Enter')
    assert.equal(await page.$eval(input, (el: HTMLInputElement) => el.value), 'Blueberry')
    assert.equal((await formData(page))['fruit'], 'blueberry')
    const events = (await page.evaluate(() => (window as any).events)).filter(
      (e: any) => e.target === 'fruit',
    )
    assert.deepEqual(
      events.map((e: any) => e.type),
      ['cv-value-change', 'input', 'change'],
    )
    assert.deepEqual(events[0].detail, { value: 'blueberry' })

    await page.keyboard.press('Alt+ArrowDown')
    assert.equal(await attr(page, input, 'aria-expanded'), 'true')
    await page.keyboard.press('Alt+ArrowUp')
    assert.equal(await attr(page, input, 'aria-expanded'), 'false')

    await page.keyboard.press('ControlOrMeta+a')
    await page.keyboard.type('zz')
    assert.equal(
      await page.$eval('#fruit .cv-combobox-empty', (el: HTMLElement) => el.hidden),
      false,
    )
    await page.keyboard.press('Tab')
    assert.equal(await attr(page, input, 'aria-expanded'), 'false', 'Tab closes')

    // Regression: `.disabled = true` re-queued a mutation on every render, a page-freezing loop.
    await page.$eval('#fruit', (el: Element) => el.setAttribute('disabled', ''))
    assert.equal(await page.$eval(input, (el: HTMLInputElement) => el.disabled), true)
    await page.$eval('#fruit', (el: Element) => el.removeAttribute('disabled'))
    assert.equal(await page.$eval(input, (el: HTMLInputElement) => el.disabled), false)

    await page.evaluate(() => (document.getElementById('pilot') as HTMLFormElement).reset())
    assert.equal(await page.$eval('#fruit', (el: any) => el.value), 'apple', 'form reset')
    await page.$eval('#fruit', (el: any) => (el.value = ''))
    assert.equal(await page.$eval('#fruit', (el: any) => el.matches(':invalid')), true, 'required')
    await close()
  })

  it('cv-date-picker: APG date picker dialog keyboard, typing, bounds, form value', async () => {
    const { page, close } = await open()
    const input = '#due-input'
    assert.equal(await page.$eval(input, (el: HTMLInputElement) => el.value), '11/21/2026')
    await page.focus(input)
    await page.keyboard.press('ArrowDown')
    assert.equal(await attr(page, input, 'aria-expanded'), 'true')
    const day = () => page.evaluate(() => (document.activeElement as HTMLElement).dataset['day'])
    await opened(page)
    assert.equal(await day(), '2026-11-21', 'focus lands on the selected day')
    await page.keyboard.press('ArrowRight')
    assert.equal(await day(), '2026-11-22')
    await page.keyboard.press('ArrowDown')
    assert.equal(await day(), '2026-11-29')
    await page.keyboard.press('PageDown')
    assert.equal(await day(), '2026-12-29')
    assert.match(
      await page.$eval('#due .cv-calendar-monthLabel', (el: Element) => el.textContent),
      /December 2026/,
    )
    await page.keyboard.press('Shift+PageDown')
    assert.equal(await day(), '2027-06-30', 'clamped to max')
    await page.keyboard.press('Home')
    assert.equal(await day(), '2027-06-28', "Home: the week's first day ('en' weeks start Monday)")
    await page.keyboard.press('Enter')
    assert.equal(await attr(page, input, 'aria-expanded'), 'false')
    assert.equal((await formData(page))['due'], '2027-06-28')
    assert.equal(
      await page.evaluate(() => document.activeElement?.id),
      'due-input',
      'focus returns',
    )

    await page.fill(input, '3/4/2026')
    await page.keyboard.press('Enter')
    assert.equal(await page.$eval('#due', (el: any) => el.value), '2026-03-04')
    await page.fill(input, '3/4/2030')
    await page.keyboard.press('Enter')
    assert.equal(
      await page.$eval('#due', (el: any) => el.value),
      '2026-03-04',
      'out of range is rejected',
    )

    await page.click('#due .cv-date-picker-openButton')
    await page.click('#due [data-nav="1"]')
    assert.match(
      await page.$eval('#due .cv-calendar-monthLabel', (el: Element) => el.textContent),
      /April 2026/,
    )
    assert.equal(
      await attr(page, input, 'aria-expanded'),
      'true',
      'month nav keeps the dialog open',
    )
    await page.keyboard.press('Escape')
    assert.equal(await attr(page, input, 'aria-expanded'), 'false')
    const events = (await page.evaluate(() => (window as any).events)).filter(
      (e: any) => e.target === 'due',
    )
    assert.ok(
      events.some((e: any) => e.type === 'change'),
      'native change on the host',
    )
    await close()
  })

  it('axe: no WCAG 2.2 AA violations, closed and with each popup open', async () => {
    const { page, close } = await open()
    await page.addScriptTag({ url: '/axe.js' })
    const run = () =>
      page.evaluate(async () => {
        const r = await (window as any).axe.run(document, {
          runOnly: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'],
        })
        return r.violations.map(
          (v: any) => `${v.id}: ${v.nodes.map((n: any) => n.target).join(' ')}`,
        )
      })
    assert.deepEqual(await run(), [], 'closed')
    for (const trigger of [
      '#actions [aria-haspopup]',
      '#fruit-input',
      '#due .cv-date-picker-openButton',
    ]) {
      await page.click(trigger)
      if (trigger === '#fruit-input') await page.keyboard.press('ArrowDown')
      assert.deepEqual(await run(), [], `open via ${trigger}`)
      await page.keyboard.press('Escape')
    }
    await close()
  })

  for (const width of [320, 360, 390, 414]) {
    it(`${width}px coarse pointer: no overflow, every target ≥ 44px`, async () => {
      const { page, close } = await open({
        viewport: { width, height: 800 },
        hasTouch: true,
        isMobile: true,
      })
      assert.ok(
        await page.evaluate(() => matchMedia('(pointer: coarse)').matches),
        'coarse pointer emulated',
      )
      const check = async (state: string, selector: string) => {
        const scroll = await page.evaluate(() => document.documentElement.scrollWidth)
        assert.ok(scroll <= width, `${state}: page scrolls horizontally (${scroll} > ${width})`)
        const small = await page.$$eval(selector, (els: HTMLElement[]) =>
          els
            .filter((e) => e.checkVisibility() && !e.hasAttribute('hidden'))
            .map(
              (e) =>
                [
                  e.dataset['value'] ?? e.dataset['day'] ?? e.className,
                  e.getBoundingClientRect(),
                ] as const,
            )
            .filter(([, r]) => r.width < 44 || r.height < 44)
            .map(([n, r]) => `${n} ${Math.round(r.width)}x${Math.round(r.height)}`),
        )
        assert.deepEqual(small, [], `${state}: targets under 44px`)
        const outside = await page.$$eval(
          selector,
          (els: HTMLElement[], w: number) =>
            els
              .filter((e) => e.checkVisibility())
              .filter((e) => {
                const r = e.getBoundingClientRect()
                return r.left < 0 || r.right > w
              }).length,
          width,
        )
        assert.equal(outside, 0, `${state}: a target is cut off by the viewport`)
      }
      await check('closed', 'button, input')
      await page.tap('#actions [aria-haspopup]')
      await check('menu open', '[role=menuitem]')
      await page.keyboard.press('Escape')
      await page.tap('#fruit-input')
      await check('listbox open', '[role=option]')
      await page.keyboard.press('Escape')
      await page.tap('#due .cv-date-picker-openButton')
      await check('calendar open', '#due [role=dialog] button')
      await close()
    })
  }

  it('htmx/idiomorph: a morph back to the server markup keeps every element’s state', async () => {
    const { page, close } = await open()
    await page.focus('#fruit-input')
    await page.keyboard.press('ControlOrMeta+a')
    await page.keyboard.type('gr')
    await page.keyboard.press('Enter')
    await page.fill('#due-input', '1/2/2027')
    await page.keyboard.press('Enter')
    await page.click('#plan-trigger-history')
    await page.click('#actions [aria-haspopup]')
    const before = await formData(page)
    assert.deepEqual(before, { fruit: 'grape', due: '2027-01-02' })

    await page.evaluate((html: string) => {
      ;(window as any).Idiomorph.morph(document.getElementById('pilot'), html)
    }, PILOT)
    await tick(page)

    assert.equal(
      await page.$eval('#pilot', (el: Element) => el.querySelector('#fruit') !== null),
      true,
    )
    assert.deepEqual(await formData(page), before, 'form values survive')
    assert.equal(await page.$eval('#fruit-input', (el: HTMLInputElement) => el.value), 'Grape')
    assert.equal(await page.$eval('#due-input', (el: HTMLInputElement) => el.value), '1/2/2027')
    assert.equal(
      await attr(page, '#actions [aria-haspopup]', 'aria-expanded'),
      'true',
      'menu stays open',
    )
    assert.equal(await attr(page, '#actions [role=menu]', 'data-state'), 'open')
    assert.equal(await attr(page, '#plan-trigger-history', 'aria-selected'), 'true', 'tab stays')
    assert.equal(await attr(page, '#plan-content-history', 'hidden'), null)
    assert.equal(await attr(page, '#plan-content-overview', 'hidden'), '')
    assert.ok(await attr(page, '#fruit-input', 'aria-controls'), 'ARIA wiring is repaired')
    // And still interactive after the morph.
    await page.keyboard.press('Escape')
    await page.focus('#due-input')
    await page.keyboard.press('ArrowDown')
    await opened(page)
    assert.equal(
      await page.evaluate(() => (document.activeElement as HTMLElement).dataset['day']),
      '2027-01-02',
    )
    await close()
  })
})
