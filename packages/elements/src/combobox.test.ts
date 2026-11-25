import axe from 'axe-core'
import { Idiomorph } from 'idiomorph'
import { beforeAll, describe, expect, it } from 'vitest'
import { CvCombobox, define } from './combobox.ts'

const opt = (v: string, label: string, extra = '') =>
  `<div role="option" data-value="${v}" class="cv-combobox-option"${extra}>${label}</div>`

const html = (attrs = '') => `<form id="f"><cv-combobox id="demo" name="fruit"${attrs}>
<div class="cv-combobox-wrapper"><label id="demo-label" for="demo-input">Fruit</label>
<input id="demo-input" role="combobox" class="cv-combobox-input" type="text" autocomplete="off" aria-autocomplete="list" aria-haspopup="listbox" />
<div class="cv-combobox-popup"><div role="listbox" class="cv-combobox-listbox">
${opt('apple', 'Apple')}${opt('apricot', 'Apricot', ' aria-disabled="true"')}${opt('banana', 'Banana')}${opt('cherry', 'Cherry')}
</div><div class="cv-combobox-empty" hidden></div></div>
<span class="cv-combobox-srOnly" aria-live="polite"></span></div></cv-combobox>
<button type="reset" id="reset">Reset</button></form>`

// jsdom has no ElementInternals form API (setFormValue/setValidity, form reset, FormData):
// a minimal stand-in records what the element reports and replays the reset callback.
interface Reported {
  value: string
  missing: boolean
  message: string
}
const reported = new WeakMap<Element, Reported>()
function installInternals() {
  HTMLElement.prototype.attachInternals = function (this: HTMLElement) {
    const state: Reported = { value: '', missing: false, message: '' }
    reported.set(this, state)
    return {
      setFormValue: (v: string) => void (state.value = v),
      setValidity: (flags: { valueMissing?: boolean }, message = '') => {
        state.missing = !!flags.valueMissing
        state.message = state.missing ? message : ''
      },
      get form() {
        return null
      },
    } as unknown as ElementInternals
  }
  document.addEventListener('reset', (e) => {
    for (const el of (e.target as HTMLFormElement).querySelectorAll<
      HTMLElement & { formResetCallback?: () => void }
    >('*'))
      el.formResetCallback?.()
  })
}
const state = (el: Element) => reported.get(el)!
const formValid = () => ![...form().querySelectorAll('*')].some((el) => reported.get(el)?.missing)

const tick = () => new Promise<void>((r) => setTimeout(r, 0))
const root = () => document.getElementById('demo') as CvCombobox
const input = () => document.getElementById('demo-input') as HTMLInputElement
const rows = () => [...document.querySelectorAll<HTMLElement>('[role=option]')]
const visible = () =>
  rows()
    .filter((r) => !r.hidden)
    .map((r) => r.dataset['value'])
const activeValue = () => rows().find((r) => r.dataset['state'] === 'active')?.dataset['value']
const form = () => document.getElementById('f') as HTMLFormElement
const key = (k: string, init: KeyboardEventInit = {}) => {
  const e = new KeyboardEvent('keydown', { key: k, bubbles: true, cancelable: true, ...init })
  input().dispatchEvent(e)
  return e
}
const type = (text: string) => {
  input().value = text
  input().dispatchEvent(new Event('input', { bubbles: true }))
}

async function mount(attrs = '') {
  document.body.innerHTML = html(attrs)
  await tick()
}

beforeAll(() => {
  installInternals()
  define()
})

describe('cv-combobox', () => {
  it('wires APG roles and attributes while closed', async () => {
    await mount()
    expect(input().getAttribute('aria-expanded')).toBe('false')
    expect(input().getAttribute('aria-controls')).toBe(document.querySelector('[role=listbox]')!.id)
    expect(document.querySelector('[role=listbox]')!.getAttribute('aria-labelledby')).toBe(
      'demo-label',
    )
    expect(rows().every((r) => r.id && r.getAttribute('aria-selected') === 'false')).toBe(true)
    expect(input().placeholder).toBe('Select an option')
    expect(root().value).toBe('')
  })

  it('click opens, typing filters, ArrowDown wraps and skips disabled rows', async () => {
    await mount()
    input().click()
    await tick()
    expect(input().getAttribute('aria-expanded')).toBe('true')
    expect(activeValue()).toBe('apple')
    expect(input().getAttribute('aria-activedescendant')).toBe(rows()[0]!.id)
    key('ArrowDown')
    await tick()
    expect(activeValue()).toBe('banana')
    key('ArrowDown')
    key('ArrowDown')
    await tick()
    expect(activeValue()).toBe('apple')
    key('ArrowUp')
    await tick()
    expect(activeValue()).toBe('cherry')
  })

  it('typing filters rows, opens the list, announces the count and shows the empty state', async () => {
    await mount()
    type('an')
    await tick()
    expect(input().getAttribute('aria-expanded')).toBe('true')
    expect(visible()).toEqual(['banana'])
    expect(activeValue()).toBe('banana')
    expect(document.querySelector('[aria-live]')!.textContent).toBe('1 options available')
    type('zzz')
    await tick()
    expect(visible()).toEqual([])
    expect(document.querySelector<HTMLElement>('.cv-combobox-empty')!.hidden).toBe(false)
    expect(document.querySelector('.cv-combobox-empty')!.textContent).toBe('No options found')
  })

  it('ArrowDown/ArrowUp open a closed list (ArrowUp seeds the last row); Alt+arrows open/close', async () => {
    await mount()
    key('ArrowUp')
    await tick()
    expect(activeValue()).toBe('cherry')
    key('ArrowUp', { altKey: true })
    await tick()
    expect(root().isOpen).toBe(false)
    key('ArrowDown', { altKey: true })
    await tick()
    expect(root().isOpen).toBe(true)
    expect(activeValue()).toBe('apple')
  })

  it('Enter picks the active row: value, form data, native + cv events, closes', async () => {
    await mount()
    const seen: unknown[] = []
    const natives: string[] = []
    root().addEventListener('cv-value-change', (e) => seen.push((e as CustomEvent).detail))
    form().addEventListener('change', (e) => natives.push((e.target as Element).tagName))
    key('ArrowDown')
    key('ArrowDown')
    await tick()
    key('Enter')
    await tick()
    expect(root().value).toBe('banana')
    expect(seen).toEqual([{ value: 'banana' }])
    expect(natives).toEqual(['CV-COMBOBOX'])
    expect(state(root()).value).toBe('banana')
    expect(root().isOpen).toBe(false)
    expect(input().value).toBe('Banana')
    expect(rows()[2]!.getAttribute('aria-selected')).toBe('true')
    expect(document.activeElement).toBe(input())
  })

  it('Enter while closed does nothing; Escape closes and keeps the value', async () => {
    await mount(' value="cherry"')
    const e = key('Enter')
    expect(e.defaultPrevented).toBe(false)
    key('ArrowDown')
    await tick()
    expect(key('Escape').defaultPrevented).toBe(true)
    await tick()
    expect(root().isOpen).toBe(false)
    expect(root().value).toBe('cherry')
    expect(input().value).toBe('Cherry')
  })

  it('click on a row picks it; a disabled row is ignored; re-picking is silent', async () => {
    await mount()
    const seen: unknown[] = []
    root().addEventListener('cv-value-change', (e) => seen.push((e as CustomEvent).detail))
    input().click()
    await tick()
    rows()[1]!.click()
    expect(root().value).toBe('')
    rows()[3]!.click()
    await tick()
    expect(root().value).toBe('cherry')
    input().click()
    rows()[3]!.click()
    await tick()
    expect(seen).toEqual([{ value: 'cherry' }])
  })

  it('Tab closes without moving focus; an outside blur dismisses', async () => {
    await mount()
    key('ArrowDown')
    await tick()
    key('Tab')
    await tick()
    expect(root().isOpen).toBe(false)
    key('ArrowDown')
    await tick()
    input().dispatchEvent(
      new FocusEvent('focusout', { bubbles: true, relatedTarget: document.body }),
    )
    await tick()
    expect(root().isOpen).toBe(false)
  })

  it('does nothing when disabled', async () => {
    await mount(' disabled')
    expect(input().disabled).toBe(true)
    key('ArrowDown')
    await tick()
    expect(root().isOpen).toBe(false)
  })

  it('value attribute is the initial value; the property setter syncs the form', async () => {
    await mount(' value="apple"')
    expect(root().value).toBe('apple')
    expect(input().value).toBe('Apple')
    root().value = 'cherry'
    await tick()
    expect(input().value).toBe('Cherry')
    expect(state(root()).value).toBe('cherry')
  })

  it('form reset restores the initial value', async () => {
    await mount(' value="apple"')
    root().value = 'cherry'
    await tick()
    form().reset()
    await tick()
    expect(root().value).toBe('apple')
    expect(input().value).toBe('Apple')
  })

  it('required: invalid while empty with the message, valid once chosen, again after reset', async () => {
    await mount(' required')
    expect(input().getAttribute('aria-required')).toBe('true')
    expect(state(root()).missing).toBe(true)
    expect(state(root()).message).toBe('Please fill out this field.')
    expect(formValid()).toBe(false)
    root().value = 'banana'
    await tick()
    expect(formValid()).toBe(true)
    form().reset()
    await tick()
    expect(formValid()).toBe(false)
  })

  it('does not leak the inner input/change events to host listeners', async () => {
    await mount()
    const targets: unknown[] = []
    form().addEventListener('input', (e) => targets.push(e.target))
    type('ap')
    await tick()
    expect(targets).toEqual([])
  })

  it('survives an idiomorph morph back to the server markup', async () => {
    await mount()
    key('ArrowDown')
    key('ArrowDown')
    await tick()
    key('Enter')
    await tick()
    Idiomorph.morph(form(), html(), { morphStyle: 'outerHTML' })
    await tick()
    expect(root().value).toBe('banana')
    expect(input().value).toBe('Banana')
    expect(rows()[2]!.getAttribute('aria-selected')).toBe('true')
    key('ArrowDown')
    await tick()
    expect(input().getAttribute('aria-expanded')).toBe('true')
    rows()[3]!.click()
    await tick()
    expect(root().value).toBe('cherry')
  })

  it('is axe clean closed and open', async () => {
    const opts = {
      runOnly: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'],
      rules: { 'color-contrast': { enabled: false } },
    }
    await mount()
    expect((await axe.run(document.body, opts)).violations.map((v) => v.id)).toEqual([])
    key('ArrowDown')
    await tick()
    expect((await axe.run(document.body, opts)).violations.map((v) => v.id)).toEqual([])
  })
})
