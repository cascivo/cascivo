import axe from 'axe-core'
import { Idiomorph } from 'idiomorph'
import { beforeAll, describe, expect, it } from 'vitest'
import { define } from './menu.ts'

const html =
  () => `<cv-menu id="demo"><button type="button" id="trg" aria-haspopup="menu">Actions</button>
<div role="menu" popover="auto" aria-label="Actions">
<button type="button" role="menuitem" data-value="edit">Edit</button>
<button type="button" role="menuitem" aria-disabled="true" data-value="dup">Duplicate</button>
<button type="button" role="menuitem">Delete</button>
<button type="button" role="menuitem" data-value="archive">Archive</button>
</div></cv-menu>`

const tick = () => new Promise<void>((r) => setTimeout(r, 0))
const root = () => document.getElementById('demo') as HTMLElement
const trigger = () => document.getElementById('trg') as HTMLElement
const items = () => [...document.querySelectorAll<HTMLElement>('[role=menuitem]')]
const panel = () => document.querySelector('[role=menu]') as HTMLElement
const key = (target: Element, k: string, init: KeyboardEventInit = {}) => {
  const e = new KeyboardEvent('keydown', { key: k, bubbles: true, cancelable: true, ...init })
  target.dispatchEvent(e)
  return e
}

async function mount() {
  document.body.innerHTML = html()
  await tick()
}
async function open() {
  await mount()
  trigger().click()
  await tick()
}

beforeAll(define)

describe('cv-menu', () => {
  it('wires aria on the trigger and panel, closed by default', async () => {
    await mount()
    expect(trigger().getAttribute('aria-expanded')).toBe('false')
    expect(trigger().getAttribute('aria-controls')).toBe(panel().id)
    expect(panel().getAttribute('popover')).toBe('auto')
    expect(panel().dataset['state']).toBe('closed')
    expect(items().map((i) => i.tabIndex)).toEqual([0, -1, 0, 0])
  })

  it('click toggles open and focuses the first enabled item', async () => {
    await open()
    expect(trigger().getAttribute('aria-expanded')).toBe('true')
    expect(panel().dataset['state']).toBe('open')
    expect(document.activeElement).toBe(items()[0])
    trigger().click()
    await tick()
    expect(trigger().getAttribute('aria-expanded')).toBe('false')
  })

  it('ArrowDown/ArrowUp on the trigger open the menu and prevent scrolling', async () => {
    await mount()
    expect(key(trigger(), 'ArrowDown').defaultPrevented).toBe(true)
    await tick()
    expect(trigger().getAttribute('aria-expanded')).toBe('true')
    expect(document.activeElement).toBe(items()[0])
  })

  it('arrows wrap and skip disabled items; Home/End jump', async () => {
    await open()
    key(items()[0]!, 'ArrowDown')
    expect(document.activeElement).toBe(items()[2])
    key(items()[2]!, 'ArrowDown')
    expect(document.activeElement).toBe(items()[3])
    key(items()[3]!, 'ArrowDown')
    expect(document.activeElement).toBe(items()[0])
    key(items()[0]!, 'ArrowUp')
    expect(document.activeElement).toBe(items()[3])
    key(items()[3]!, 'Home')
    expect(document.activeElement).toBe(items()[0])
    key(items()[0]!, 'End')
    expect(document.activeElement).toBe(items()[3])
  })

  it('Enter and Space activate: cv-select carries data-value, else the text; menu closes', async () => {
    await open()
    const seen: unknown[] = []
    root().addEventListener('cv-select', (e) => seen.push((e as CustomEvent).detail))
    key(items()[0]!, 'Enter')
    await tick()
    expect(trigger().getAttribute('aria-expanded')).toBe('false')
    expect(document.activeElement).toBe(trigger())
    trigger().click()
    await tick()
    key(items()[2]!, ' ')
    expect(seen).toEqual([{ value: 'edit' }, { value: 'Delete' }])
  })

  it('click on an item selects; click on a disabled item does nothing', async () => {
    await open()
    const seen: unknown[] = []
    root().addEventListener('cv-select', (e) => seen.push((e as CustomEvent).detail))
    items()[1]!.click()
    expect(seen).toEqual([])
    items()[3]!.click()
    await tick()
    expect(seen).toEqual([{ value: 'archive' }])
    expect(trigger().getAttribute('aria-expanded')).toBe('false')
  })

  it('Escape closes and returns focus to the trigger', async () => {
    await open()
    expect(key(items()[0]!, 'Escape').defaultPrevented).toBe(true)
    await tick()
    expect(trigger().getAttribute('aria-expanded')).toBe('false')
    expect(document.activeElement).toBe(trigger())
  })

  it('Tab closes without stealing focus', async () => {
    await open()
    key(items()[0]!, 'Tab')
    await tick()
    expect(trigger().getAttribute('aria-expanded')).toBe('false')
  })

  it('typeahead focuses the first matching label and accumulates', async () => {
    await open()
    key(items()[0]!, 'a')
    expect(document.activeElement).toBe(items()[3])
    key(items()[3]!, 'x')
    expect(document.activeElement).toBe(items()[3])
    key(items()[3]!, 'd', { ctrlKey: true })
    expect(document.activeElement).toBe(items()[3])
  })

  it('typeahead skips disabled items', async () => {
    await open()
    key(items()[0]!, 'd')
    expect(document.activeElement).toBe(items()[2])
  })

  it('a native light dismiss (toggle to closed) is followed', async () => {
    await open()
    const e = new Event('toggle')
    Object.assign(e, { newState: 'closed' })
    panel().dispatchEvent(e)
    await tick()
    expect(trigger().getAttribute('aria-expanded')).toBe('false')
  })

  it('survives an idiomorph morph back to the server markup', async () => {
    await open()
    Idiomorph.morph(root(), html(), { morphStyle: 'outerHTML' })
    await tick()
    expect(trigger().getAttribute('aria-expanded')).toBe('true')
    expect(panel().dataset['state']).toBe('open')
    expect(items().map((i) => i.tabIndex)).toEqual([0, -1, 0, 0])
    items()[3]!.click()
    await tick()
    expect(trigger().getAttribute('aria-expanded')).toBe('false')
  })

  it('is axe clean closed and open', async () => {
    const opts = {
      runOnly: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'],
      rules: { 'color-contrast': { enabled: false } },
    }
    await mount()
    expect((await axe.run(document.body, opts)).violations.map((v) => v.id)).toEqual([])
    trigger().click()
    await tick()
    expect((await axe.run(document.body, opts)).violations.map((v) => v.id)).toEqual([])
  })
})
