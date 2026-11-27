import axe from 'axe-core'
import { Idiomorph } from 'idiomorph'
import { beforeAll, describe, expect, it } from 'vitest'
import { CvMultiSelect, define } from './multi-select.ts'

// jsdom's ElementInternals has no setFormValue/setValidity: record what the element sends.
interface Fake {
  value: FormData | null
  validity: { flags: object; message?: string }
  form: HTMLFormElement | null
}
const fakes = new WeakMap<Element, Fake>()
HTMLElement.prototype.attachInternals = function (this: HTMLElement) {
  const fake: Fake = { value: null, validity: { flags: {} }, form: null }
  fakes.set(this, fake)
  return {
    get form() {
      return fake.form
    },
    setFormValue: (v: FormData | null) => (fake.value = v),
    setValidity: (flags: object, message?: string) => (fake.validity = { flags, message }),
  } as unknown as ElementInternals
}

const opt = (v: string, extra = '') =>
  `<div role="option" data-value="${v}" aria-selected="false"${extra}><span class="cv-multi-select-checkbox" aria-hidden="true"></span><span class="cv-multi-select-option-label">${v.toUpperCase()}</span></div>`

const html = (
  attrs = '',
  display = 'chips',
  selected = '',
) => `<cv-multi-select id="demo" name="tags"${attrs}>
<div class="cv-multi-select-wrapper" data-state="closed"><label class="cv-multi-select-label" for="t">Tags</label>
<div class="cv-multi-select-field" data-display="${display}">
<button type="button" id="t" class="cv-multi-select-trigger"><span class="cv-multi-select-trigger-label"><span class="cv-multi-select-sr-only">x</span></span><span class="cv-multi-select-chevron" aria-hidden="true"></span></button>
<button type="button" class="cv-multi-select-clear" aria-label="Clear"><span aria-hidden="true">x</span></button></div>
<div class="cv-multi-select-panel" popover="auto"><div class="cv-multi-select-search-row"><input type="text" role="combobox" class="cv-multi-select-search" aria-label="Search"></div>
<button type="button" class="cv-multi-select-select-all">All</button>
<div role="listbox" aria-label="Tags" class="cv-multi-select-options">${opt('a', selected.includes('a') ? ' aria-selected="true"' : '').replace('aria-selected="false" aria-selected="true"', 'aria-selected="true"')}${opt('b')}${opt('c', ' aria-disabled="true"')}${opt('d')}</div>
<div class="cv-multi-select-status" role="status" hidden>No results</div></div></div></cv-multi-select>`

const tick = () => new Promise<void>((r) => setTimeout(r, 0))
const root = () => document.getElementById('demo') as CvMultiSelect
const $ = <T extends HTMLElement>(s: string) => root().querySelector<T>(s)!
const rowOf = (v: string) => $(`[data-value="${v}"][role=option]`)
const chips = () =>
  [...root().querySelectorAll('.cv-multi-select-chip')].map(
    (c) => (c as HTMLElement).dataset['value'],
  )
const submitted = () => fakes.get(root())!.value!.getAll('tags')
const key = (target: Element, k: string) => {
  const e = new KeyboardEvent('keydown', { key: k, bubbles: true, cancelable: true })
  target.dispatchEvent(e)
  return e
}
const type = (text: string) => {
  const s = $<HTMLInputElement>('.cv-multi-select-search')
  s.value = text
  s.dispatchEvent(new Event('input', { bubbles: true }))
}

async function mount(attrs = '', display = 'chips', selected = '') {
  document.body.innerHTML = html(attrs, display, selected)
  await tick()
}

beforeAll(define)

describe('cv-multi-select', () => {
  it('seeds from aria-selected and wires the ARIA', async () => {
    await mount('', 'chips', 'a')
    expect(root().value).toEqual(['a'])
    expect(chips()).toEqual(['a'])
    expect($('[role=listbox]').getAttribute('aria-multiselectable')).toBe('true')
    expect($('.cv-multi-select-trigger').getAttribute('aria-haspopup')).toBe('listbox')
    expect($('.cv-multi-select-trigger').getAttribute('aria-expanded')).toBe('false')
    expect(submitted()).toEqual(['a'])
  })

  it('click toggles options, fires cv-value-change, submits many values, skips disabled', async () => {
    await mount()
    const seen: unknown[] = []
    root().addEventListener('cv-value-change', (e) => seen.push((e as CustomEvent).detail))
    rowOf('a').click()
    rowOf('b').click()
    rowOf('c').click()
    await tick()
    expect(seen).toEqual([{ value: ['a'] }, { value: ['a', 'b'] }])
    expect(submitted()).toEqual(['a', 'b'])
    expect(chips()).toEqual(['a', 'b'])
    expect(rowOf('a').getAttribute('aria-selected')).toBe('true')
    rowOf('a').click()
    await tick()
    expect(submitted()).toEqual(['b'])
  })

  it('chip remove and clear', async () => {
    await mount('', 'chips', 'a')
    rowOf('b').click()
    await tick()
    $<HTMLElement>('.cv-multi-select-chip-remove').click()
    await tick()
    expect(root().value).toEqual(['b'])
    expect($('.cv-multi-select-chip-remove').getAttribute('aria-label')).toBe('Remove B')
    $('.cv-multi-select-clear').click()
    await tick()
    expect(root().value).toEqual([])
    expect($('.cv-multi-select-clear').hidden).toBe(true)
  })

  it('opens on trigger click or ArrowDown; Escape closes and returns focus', async () => {
    await mount()
    $('.cv-multi-select-trigger').click()
    await tick()
    expect($('.cv-multi-select-trigger').getAttribute('aria-expanded')).toBe('true')
    expect(document.activeElement).toBe($('.cv-multi-select-search'))
    const esc = key($('.cv-multi-select-search'), 'Escape')
    expect(esc.defaultPrevented).toBe(true)
    await tick()
    expect($('.cv-multi-select-trigger').getAttribute('aria-expanded')).toBe('false')
    expect(document.activeElement).toBe($('.cv-multi-select-trigger'))
    key($('.cv-multi-select-trigger'), 'ArrowDown')
    await tick()
    expect(root().open.value).toBe(true)
  })

  it('keyboard: arrows skip disabled and wrap, Enter toggles, aria-activedescendant follows', async () => {
    await mount()
    $('.cv-multi-select-trigger').click()
    await tick()
    const search = $('.cv-multi-select-search')
    expect(search.getAttribute('aria-activedescendant')).toBe(rowOf('a').id)
    key(search, 'ArrowDown')
    await tick()
    expect(search.getAttribute('aria-activedescendant')).toBe(rowOf('b').id)
    key(search, 'ArrowDown')
    await tick()
    expect(search.getAttribute('aria-activedescendant')).toBe(rowOf('d').id)
    key(search, 'ArrowDown')
    await tick()
    expect(search.getAttribute('aria-activedescendant')).toBe(rowOf('a').id)
    key(search, 'End')
    key(search, 'Enter')
    await tick()
    expect(root().value).toEqual(['d'])
    expect(root().open.value).toBe(true)
    key(search, 'Home')
    key(search, 'Enter')
    await tick()
    expect(root().value).toEqual(['d', 'a'])
  })

  it('filters by typing and shows the empty status', async () => {
    await mount()
    $('.cv-multi-select-trigger').click()
    await tick()
    type('b')
    await tick()
    expect(rowOf('a').hidden).toBe(true)
    expect(rowOf('b').hidden).toBe(false)
    expect($('.cv-multi-select-status').hidden).toBe(true)
    type('zzz')
    await tick()
    expect($('.cv-multi-select-status').hidden).toBe(false)
    key($('.cv-multi-select-search'), 'Escape')
    await tick()
    expect($<HTMLInputElement>('.cv-multi-select-search').value).toBe('')
    expect(rowOf('a').hidden).toBe(false)
  })

  it('Backspace on an empty search removes the last chip, not while typing', async () => {
    await mount('', 'chips', 'a')
    rowOf('b').click()
    $('.cv-multi-select-trigger').click()
    await tick()
    const search = $<HTMLInputElement>('.cv-multi-select-search')
    search.value = 'x'
    key(search, 'Backspace')
    expect(root().value).toEqual(['a', 'b'])
    search.value = ''
    expect(key(search, 'Backspace').defaultPrevented).toBe(true)
    await tick()
    expect(root().value).toEqual(['a'])
  })

  it('select-all toggles every enabled option', async () => {
    await mount()
    $('.cv-multi-select-select-all').click()
    await tick()
    expect(root().value).toEqual(['a', 'b', 'd'])
    expect($('.cv-multi-select-select-all').getAttribute('aria-pressed')).toBe('true')
    $('.cv-multi-select-select-all').click()
    await tick()
    expect(root().value).toEqual([])
  })

  it('count display summarises the selection', async () => {
    await mount(' placeholder="Pick"', 'count')
    expect($('.cv-multi-select-trigger-label').textContent).toBe('Pick')
    rowOf('a').click()
    rowOf('b').click()
    await tick()
    expect($('.cv-multi-select-trigger-label').textContent).toBe('2 selected')
    expect(root().querySelector('.cv-multi-select-chip')).toBeNull()
  })

  it('required is invalid until something is selected; reset restores the seed', async () => {
    await mount(' required', 'chips', 'a')
    expect(fakes.get(root())!.validity.flags).toEqual({})
    rowOf('a').click()
    await tick()
    expect(fakes.get(root())!.validity.flags).toEqual({ valueMissing: true })
    root().formResetCallback()
    await tick()
    expect(root().value).toEqual(['a'])
    expect(fakes.get(root())!.validity.flags).toEqual({})
  })

  it('disabled ignores input', async () => {
    await mount(' disabled')
    $('.cv-multi-select-trigger').click()
    rowOf('a').click()
    await tick()
    expect(root().value).toEqual([])
    expect(root().open.value).toBe(false)
  })

  it('survives an idiomorph morph back to the server markup', async () => {
    await mount()
    rowOf('b').click()
    await tick()
    Idiomorph.morph(root(), html(), { morphStyle: 'outerHTML' })
    await tick()
    expect(root().value).toEqual(['b'])
    expect(rowOf('b').getAttribute('aria-selected')).toBe('true')
    expect(chips()).toEqual(['b'])
    rowOf('d').click()
    await tick()
    expect(submitted()).toEqual(['b', 'd'])
  })

  it('is axe clean', async () => {
    await mount('', 'chips', 'a')
    const r = await axe.run(document.body, {
      runOnly: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'],
      rules: { 'color-contrast': { enabled: false } },
    })
    expect(r.violations.map((v) => v.id)).toEqual([])
  })
})
