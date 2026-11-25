import axe from 'axe-core'
import { Idiomorph } from 'idiomorph'
import { beforeAll, describe, expect, it } from 'vitest'
import { define } from './command-menu.ts'

const html = (attrs = '') => `<button id="opener" data-cv-command-open>Open</button>
<cv-command-menu id="cmd"${attrs}><dialog class="cv-command-menu-dialog" aria-label="Commands"><div class="cv-command-menu-panel">
<input type="text" id="q" aria-label="Search commands">
<div role="listbox" id="lb" aria-label="Commands">
<div role="option" id="o-new" data-value="new">New file</div>
<div role="option" id="o-open" data-value="open">Open file</div>
<div role="option" id="o-off" data-value="off" aria-disabled="true">Disabled thing</div>
<a role="option" id="o-docs" href="#docs" data-value="docs">Docs</a>
</div><div class="cv-command-menu-empty" role="status" hidden>No results</div></div></dialog></cv-command-menu>`

const tick = () => new Promise<void>((r) => setTimeout(r, 0))
const root = () => document.getElementById('cmd') as HTMLElement
const input = () => document.getElementById('q') as HTMLInputElement
const dlg = () => document.querySelector('dialog') as HTMLDialogElement
const visible = () =>
  [...document.querySelectorAll<HTMLElement>('[role=option]')]
    .filter((o) => !o.hidden)
    .map((o) => o.id)
const key = (k: string, init: KeyboardEventInit = {}, target: EventTarget = input()) =>
  target.dispatchEvent(
    new KeyboardEvent('keydown', { key: k, bubbles: true, cancelable: true, ...init }),
  )
const type = async (v: string) => {
  input().value = v
  input().dispatchEvent(new Event('input', { bubbles: true }))
  await tick()
}
async function mount(attrs = '') {
  document.body.innerHTML = html(attrs)
  await tick()
}
const open = async () => {
  key('k', { ctrlKey: true }, document)
  await tick()
}

beforeAll(define)

describe('cv-command-menu', () => {
  it('opens on Ctrl/Cmd+K, wires the combobox and closes on the same chord', async () => {
    await mount()
    expect(dlg().open).toBe(false)
    await open()
    expect(dlg().open).toBe(true)
    expect(input().getAttribute('aria-expanded')).toBe('true')
    expect(input().getAttribute('role')).toBe('combobox')
    expect(input().getAttribute('aria-controls')).toBe('lb')
    expect(input().getAttribute('aria-activedescendant')).toBe('o-new')
    key('k', { metaKey: true }, document)
    await tick()
    expect(dlg().open).toBe(false)
  })

  it('honours a custom shortcut and ignores the default', async () => {
    await mount(' shortcut="ctrl+shift+p"')
    await open()
    expect(dlg().open).toBe(false)
    key('p', { ctrlKey: true, shiftKey: true }, document)
    await tick()
    expect(dlg().open).toBe(true)
  })

  it('opens from [data-cv-command-open]', async () => {
    await mount()
    document.getElementById('opener')!.click()
    await tick()
    expect(dlg().open).toBe(true)
  })

  it('filters rows, shows the empty state, and resets on reopen', async () => {
    await mount()
    await open()
    await type('file')
    expect(visible()).toEqual(['o-new', 'o-open'])
    await type('zzz')
    expect(visible()).toEqual([])
    expect(document.querySelector<HTMLElement>('.cv-command-menu-empty')!.hidden).toBe(false)
    await type('')
    expect(document.querySelector<HTMLElement>('.cv-command-menu-empty')!.hidden).toBe(true)
    await type('docs')
    key('Escape')
    await tick()
    await open()
    expect(input().value).toBe('')
    expect(visible()).toHaveLength(4)
  })

  it('arrows wrap, skip disabled rows, Home/End move the active descendant', async () => {
    await mount()
    await open()
    const active = () => input().getAttribute('aria-activedescendant')
    key('ArrowDown')
    await tick()
    expect(active()).toBe('o-open')
    key('ArrowDown')
    await tick()
    expect(active()).toBe('o-docs')
    key('ArrowDown')
    await tick()
    expect(active()).toBe('o-new')
    key('ArrowUp')
    await tick()
    expect(active()).toBe('o-docs')
    key('Home')
    await tick()
    expect(active()).toBe('o-new')
    key('End')
    await tick()
    expect(active()).toBe('o-docs')
    expect(document.getElementById('o-docs')!.getAttribute('aria-selected')).toBe('true')
    expect(document.getElementById('o-new')!.getAttribute('aria-selected')).toBe('false')
  })

  it('Enter clicks the active row (anchor-friendly), fires cv-select and closes', async () => {
    await mount()
    await open()
    const seen: unknown[] = []
    root().addEventListener('cv-select', (e) => seen.push((e as CustomEvent).detail))
    let clicked = 0
    document.getElementById('o-open')!.addEventListener('click', () => clicked++)
    key('ArrowDown')
    await tick()
    key('Enter')
    await tick()
    expect(clicked).toBe(1)
    expect(seen).toEqual([{ value: 'open' }])
    expect(dlg().open).toBe(false)
  })

  it('clicking a disabled row does nothing; Escape closes; Enter with no match is inert', async () => {
    await mount()
    await open()
    const seen: unknown[] = []
    root().addEventListener('cv-select', (e) => seen.push((e as CustomEvent).detail))
    document.getElementById('o-off')!.click()
    await type('zzz')
    key('Enter')
    expect(seen).toEqual([])
    expect(dlg().open).toBe(true)
    key('Escape')
    await tick()
    expect(dlg().open).toBe(false)
  })

  it('follows a native close of the dialog', async () => {
    await mount()
    await open()
    dlg().dispatchEvent(new Event('close'))
    await tick()
    expect((root() as unknown as { open: boolean }).open).toBe(false)
  })

  it('survives an idiomorph morph while open', async () => {
    await mount()
    await open()
    await type('docs')
    Idiomorph.morph(root(), html().split('\n').slice(1).join('\n'), { morphStyle: 'outerHTML' })
    await tick()
    expect(visible()).toEqual(['o-docs'])
    expect(input().getAttribute('aria-activedescendant')).toBe('o-docs')
  })

  it('is axe clean', async () => {
    await mount()
    await open()
    const r = await axe.run(document.body, { rules: { region: { enabled: false } } })
    expect(r.violations.map((v) => v.id)).toEqual([])
  })
})
