import axe from 'axe-core'
import { Idiomorph } from 'idiomorph'
import { beforeAll, describe, expect, it } from 'vitest'
import { define } from './drawer.ts'

const html = (
  attrs = '',
) => `<main><button id="opener" data-cv-drawer-open="dr">Open</button></main>
<cv-drawer id="dr"${attrs}><div class="cv-drawer-overlay" data-side="end">
<div role="dialog" aria-modal="true" aria-labelledby="dr-t" class="cv-drawer-panel" data-side="end">
<div class="cv-drawer-header"><div><h2 id="dr-t">Filters</h2></div>
<button type="button" class="cv-drawer-close" aria-label="Close"><svg aria-hidden="true"></svg></button></div>
<div class="cv-drawer-body"><input id="f" aria-label="Name"><button id="last" type="button">Apply</button></div>
</div></div></cv-drawer>`

const tick = () => new Promise<void>((r) => setTimeout(r, 0))
const root = () => document.getElementById('dr') as HTMLElement
const overlay = () => document.querySelector('.cv-drawer-overlay') as HTMLElement
const key = (t: Element, k: string, shift = false) =>
  t.dispatchEvent(
    new KeyboardEvent('keydown', { key: k, shiftKey: shift, bubbles: true, cancelable: true }),
  )

async function mount(attrs = '') {
  document.body.innerHTML = html(attrs)
  await tick()
}
const opener = () => document.getElementById('opener')!

beforeAll(() => {
  // jsdom has no checkVisibility.
  Element.prototype.checkVisibility ??= () => true
  define()
})

describe('cv-drawer', () => {
  it('starts closed: inert and data-state closed', async () => {
    await mount()
    expect(overlay().dataset['state']).toBe('closed')
    expect(overlay().hasAttribute('inert')).toBe(true)
    expect(root().hasAttribute('open')).toBe(false)
  })

  it('opens from the opener, moves focus in, inerts the rest, fires cv-open', async () => {
    await mount()
    let opened = 0
    root().addEventListener('cv-open', () => opened++)
    opener().focus()
    opener().click()
    await tick()
    expect(opened).toBe(1)
    expect(overlay().dataset['state']).toBe('open')
    expect(overlay().hasAttribute('inert')).toBe(false)
    expect(document.activeElement?.id).toBe('f')
    expect(document.querySelector('main')!.hasAttribute('inert')).toBe(true)
  })

  it('closes on Escape, close button, backdrop (not when static) and returns focus', async () => {
    await mount()
    const closed: number[] = []
    root().addEventListener('cv-close', () => closed.push(1))
    for (const how of ['esc', 'btn', 'backdrop']) {
      opener().focus()
      opener().click()
      await tick()
      if (how === 'esc') key(document.activeElement!, 'Escape')
      else if (how === 'btn') document.querySelector<HTMLElement>('.cv-drawer-close')!.click()
      else overlay().click()
      await tick()
      expect(overlay().dataset['state']).toBe('closed')
      expect(document.activeElement).toBe(opener())
      expect(document.querySelector('main')!.hasAttribute('inert')).toBe(false)
    }
    expect(closed.length).toBe(3)
    await mount(' static')
    opener().click()
    await tick()
    overlay().click()
    await tick()
    expect(overlay().dataset['state']).toBe('open')
  })

  it('closes from [data-cv-drawer-close] and wraps Tab', async () => {
    await mount()
    opener().click()
    await tick()
    const last = document.getElementById('last')!
    last.focus()
    key(last, 'Tab')
    expect(document.activeElement?.className).toBe('cv-drawer-close')
    key(document.activeElement!, 'Tab', true)
    expect(document.activeElement).toBe(last)
    last.setAttribute('data-cv-drawer-close', '')
    last.click()
    await tick()
    expect(overlay().dataset['state']).toBe('closed')
  })

  it('writes the side attribute and honours the open attribute', async () => {
    await mount(' open side="start"')
    expect(overlay().dataset['state']).toBe('open')
    expect(overlay().dataset['side']).toBe('start')
    expect(document.querySelector('[role=dialog]')!.getAttribute('data-side')).toBe('start')
  })

  it('keeps its open state through an idiomorph morph', async () => {
    await mount()
    opener().click()
    await tick()
    Idiomorph.morph(root(), html().slice(html().indexOf('<cv-drawer')), { morphStyle: 'outerHTML' })
    await tick()
    expect(overlay().dataset['state']).toBe('open')
  })

  it('is axe clean open', async () => {
    await mount()
    opener().click()
    await tick()
    const r = await axe.run(root(), {
      runOnly: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'],
      rules: { 'color-contrast': { enabled: false } },
    })
    expect(r.violations.map((v) => v.id)).toEqual([])
  })
})
