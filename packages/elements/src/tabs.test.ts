import axe from 'axe-core'
import { Idiomorph } from 'idiomorph'
import { beforeAll, describe, expect, it } from 'vitest'
import { define } from './tabs.ts'

const tab = (v: string, selected: boolean, extra = '') =>
  `<button type="button" role="tab" id="t-${v}" aria-selected="${selected}" aria-controls="p-${v}" data-state="${selected ? 'active' : 'inactive'}" data-value="${v}" tabindex="${selected ? 0 : -1}"${extra}>${v}</button>`
const panel = (v: string, hidden: boolean) =>
  `<div role="tabpanel" id="p-${v}" aria-labelledby="t-${v}" data-state="${hidden ? 'inactive' : 'active'}" tabindex="0"${hidden ? ' hidden' : ''}>${v} body</div>`

const html = (attrs = '') => `<cv-tabs id="demo"${attrs}>
<div class="cv-tabs-tabs"><div role="tablist" class="cv-tabs-list" aria-label="Sections">
${tab('a', true)}${tab('b', false)}${tab('c', false, ' disabled')}${tab('d', false)}
</div>${panel('a', false)}${panel('b', true)}${panel('c', true)}${panel('d', true)}</div></cv-tabs>`

const tick = () => new Promise<void>((r) => setTimeout(r, 0))
const root = () => document.getElementById('demo') as HTMLElement
const el = (v: string) => document.getElementById(`t-${v}`) as HTMLElement
const selected = () =>
  [...document.querySelectorAll('[role=tab]')]
    .filter((t) => t.getAttribute('aria-selected') === 'true')
    .map((t) => (t as HTMLElement).dataset['value'])
const shown = () =>
  [...document.querySelectorAll<HTMLElement>('[role=tabpanel]')]
    .filter((p) => !p.hidden)
    .map((p) => p.id)
const key = (target: HTMLElement, k: string) =>
  target.dispatchEvent(new KeyboardEvent('keydown', { key: k, bubbles: true, cancelable: true }))

async function mount(attrs = '') {
  document.body.innerHTML = html(attrs)
  await tick()
}

beforeAll(define)

describe('cv-tabs', () => {
  it('projects the server selection onto tabs and panels', async () => {
    await mount()
    expect(selected()).toEqual(['a'])
    expect(shown()).toEqual(['p-a'])
    expect(el('b').tabIndex).toBe(-1)
    expect(el('a').tabIndex).toBe(0)
  })

  it('selects the first tab when the server marked none', async () => {
    document.body.innerHTML = html().replace('aria-selected="true"', 'aria-selected="false"')
    await tick()
    expect(selected()).toEqual(['a'])
  })

  it('click selects, fires cv-value-change once, and ignores a disabled tab', async () => {
    await mount()
    const seen: unknown[] = []
    root().addEventListener('cv-value-change', (e) => seen.push((e as CustomEvent).detail))
    el('b').click()
    el('b').click()
    el('c').click()
    await tick()
    expect(seen).toEqual([{ value: 'b' }])
    expect(selected()).toEqual(['b'])
    expect(shown()).toEqual(['p-b'])
  })

  it('APG keys: arrows wrap and skip disabled, Home/End, automatic activation', async () => {
    await mount()
    el('a').focus()
    key(el('a'), 'ArrowRight')
    expect(document.activeElement).toBe(el('b'))
    key(el('b'), 'ArrowRight')
    expect(document.activeElement).toBe(el('d'))
    key(el('d'), 'ArrowRight')
    expect(document.activeElement).toBe(el('a'))
    key(el('a'), 'ArrowLeft')
    expect(document.activeElement).toBe(el('d'))
    key(el('d'), 'Home')
    expect(document.activeElement).toBe(el('a'))
    key(el('a'), 'End')
    expect(document.activeElement).toBe(el('d'))
    await tick()
    expect(selected()).toEqual(['d'])
    expect(el('d').tabIndex).toBe(0)
  })

  it('manual activation moves focus without selecting; Enter (click) selects', async () => {
    await mount(' activation="manual"')
    key(el('a'), 'ArrowRight')
    await tick()
    expect(document.activeElement).toBe(el('b'))
    expect(selected()).toEqual(['a'])
    el('b').click()
    await tick()
    expect(selected()).toEqual(['b'])
  })

  it('ignores keys it does not own', async () => {
    await mount()
    const e = new KeyboardEvent('keydown', { key: 'a', bubbles: true, cancelable: true })
    el('a').dispatchEvent(e)
    expect(e.defaultPrevented).toBe(false)
  })

  it('survives an idiomorph morph back to the server markup', async () => {
    await mount()
    el('d').click()
    await tick()
    Idiomorph.morph(root(), html(), { morphStyle: 'outerHTML' })
    await tick()
    expect(selected()).toEqual(['d'])
    expect(shown()).toEqual(['p-d'])
    el('b').click()
    await tick()
    expect(selected()).toEqual(['b'])
  })

  it('falls back when the selected value disappears in a morph', async () => {
    await mount()
    el('d').click()
    await tick()
    Idiomorph.morph(root(), html().replace(tab('d', false), '').replace(panel('d', true), ''), {
      morphStyle: 'outerHTML',
    })
    await tick()
    expect(selected()).toEqual(['a'])
  })

  it('a nested cv-tabs keeps its own selection', async () => {
    document.body.innerHTML = `<cv-tabs id="demo"><div role="tablist">${tab('a', true)}${tab('b', false)}</div>
      <div role="tabpanel" id="p-a" aria-labelledby="t-a"><cv-tabs id="inner"><div role="tablist"><button role="tab" id="i1" data-value="i1" aria-selected="true" aria-controls="ip1">1</button><button role="tab" id="i2" data-value="i2" aria-selected="false" aria-controls="ip2">2</button></div>
      <div role="tabpanel" id="ip1">x</div><div role="tabpanel" id="ip2">y</div></cv-tabs></div>
      <div role="tabpanel" id="p-b" hidden></div></cv-tabs>`
    await tick()
    document.getElementById('i2')!.click()
    await tick()
    expect(document.getElementById('i2')!.getAttribute('aria-selected')).toBe('true')
    expect(el('a').getAttribute('aria-selected')).toBe('true')
  })

  it('is axe clean', async () => {
    await mount()
    const r = await axe.run(document.body, {
      runOnly: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'],
      rules: { 'color-contrast': { enabled: false } },
    })
    expect(r.violations.map((v) => v.id)).toEqual([])
  })
})
