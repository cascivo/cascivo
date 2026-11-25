import axe from 'axe-core'
import { Idiomorph } from 'idiomorph'
import { beforeAll, describe, expect, it } from 'vitest'
import { CvDatePicker, define } from './date-picker.ts'

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

const html = (attrs = '') => `<form id="f"><cv-date-picker id="demo" name="when"${attrs}>
<div class="cv-date-picker-wrapper"><label id="demo-label" for="demo-input">Date</label>
<input id="demo-input" role="combobox" class="cv-date-picker-input" type="text" autocomplete="off" aria-haspopup="dialog" />
<button type="button" class="cv-date-picker-openButton">C</button>
<div role="dialog" class="cv-date-picker-popup"></div></div></cv-date-picker>
<button type="reset">Reset</button></form>`

const tick = () => new Promise<void>((r) => setTimeout(r, 0))
const root = () => document.getElementById('demo') as CvDatePicker
const input = () => document.getElementById('demo-input') as HTMLInputElement
const form = () => document.getElementById('f') as HTMLFormElement
const day = (iso: string) => document.querySelector<HTMLElement>(`[data-day="${iso}"]`)
const focused = () => (document.activeElement as HTMLElement | null)?.dataset['day']
const key = (target: Element, k: string, init: KeyboardEventInit = {}) => {
  const e = new KeyboardEvent('keydown', { key: k, bubbles: true, cancelable: true, ...init })
  target.dispatchEvent(e)
  return e
}
// The grid cursor, as the roving-tabindex day
const cursorDay = () =>
  document.querySelector<HTMLElement>('[data-day][tabindex="0"]')?.dataset['day']
const openButton = () => document.querySelector<HTMLElement>('.cv-date-picker-openButton')!
const monthLabel = () => document.querySelector('.cv-calendar-monthLabel')!.textContent

async function mount(attrs = ' value="2024-03-15"') {
  document.body.innerHTML = html(attrs)
  await tick()
}
async function open(attrs?: string) {
  await mount(attrs)
  openButton().click()
  await tick()
}

beforeAll(() => {
  installInternals()
  define()
})

describe('cv-date-picker', () => {
  it('shows the initial value formatted, and ARIA wiring while closed', async () => {
    await mount()
    expect(root().value).toBe('2024-03-15')
    expect(input().value).toMatch(/2024/)
    expect(state(root()).value).toBe('2024-03-15')
    expect(input().getAttribute('aria-expanded')).toBe('false')
    expect(openButton().getAttribute('aria-label')).toBe('Open calendar')
    expect(document.querySelector('[role=dialog]')!.getAttribute('aria-label')).toBe('Date')
  })

  it('the button opens the dialog, renders the month and focuses the selected day', async () => {
    await open()
    expect(root().isOpen).toBe(true)
    expect(input().getAttribute('aria-expanded')).toBe('true')
    expect(monthLabel()).toBe('March 2024')
    expect(document.querySelectorAll('[data-day]').length).toBe(31)
    expect(cursorDay()).toBe('2024-03-15')
    expect(day('2024-03-15')!.getAttribute('aria-selected')).toBe('true')
    await tick()
    expect(focused()).toBe('2024-03-15')
    openButton().click()
    await tick()
    expect(root().isOpen).toBe(false)
  })

  it('ArrowDown in the input opens the calendar', async () => {
    await mount()
    expect(key(input(), 'ArrowDown').defaultPrevented).toBe(true)
    await tick()
    expect(root().isOpen).toBe(true)
  })

  it('arrow keys move the cursor by day and week', async () => {
    await open()
    const press = (k: string, from: string) => key(day(from)!, k)
    press('ArrowRight', '2024-03-15')
    await tick()
    expect(cursorDay()).toBe('2024-03-16')
    press('ArrowLeft', '2024-03-16')
    press('ArrowLeft', '2024-03-15')
    await tick()
    expect(cursorDay()).toBe('2024-03-14')
    press('ArrowDown', '2024-03-14')
    await tick()
    expect(cursorDay()).toBe('2024-03-21')
    press('ArrowUp', '2024-03-21')
    press('ArrowUp', '2024-03-14')
    await tick()
    expect(cursorDay()).toBe('2024-03-07')
  })

  it('arrows cross month boundaries', async () => {
    await open(' value="2024-03-31"')
    key(day('2024-03-31')!, 'ArrowRight')
    await tick()
    expect(cursorDay()).toBe('2024-04-01')
    expect(monthLabel()).toBe('April 2024')
  })

  it('Home/End go to the start and end of the week (locale week start)', async () => {
    await open()
    key(day('2024-03-15')!, 'Home')
    await tick()
    const start = cursorDay()!
    expect(new Date(`${start}T00:00:00Z`).getUTCDay()).toBeLessThanOrEqual(1)
    key(day(start)!, 'End')
    await tick()
    const end = cursorDay()!
    expect((Date.parse(end) - Date.parse(start)) / 864e5).toBe(6)
  })

  it('PageUp/PageDown move a month, Shift a year', async () => {
    await open()
    key(day('2024-03-15')!, 'PageDown')
    await tick()
    expect(cursorDay()).toBe('2024-04-15')
    key(day('2024-04-15')!, 'PageUp')
    await tick()
    expect(cursorDay()).toBe('2024-03-15')
    key(day('2024-03-15')!, 'PageDown', { shiftKey: true })
    await tick()
    expect(cursorDay()).toBe('2025-03-15')
    expect(monthLabel()).toBe('March 2025')
  })

  it('Enter and Space pick the cursor day: value, events, form data; closes and returns focus', async () => {
    await open()
    const seen: unknown[] = []
    root().addEventListener('cv-value-change', (e) => seen.push((e as CustomEvent).detail))
    key(day('2024-03-15')!, 'ArrowRight')
    await tick()
    key(day('2024-03-16')!, 'Enter')
    await tick()
    expect(root().value).toBe('2024-03-16')
    expect(seen).toEqual([{ value: '2024-03-16' }])
    expect(state(root()).value).toBe('2024-03-16')
    expect(root().isOpen).toBe(false)
    expect(document.activeElement).toBe(input())
    openButton().click()
    await tick()
    key(day('2024-03-16')!, ' ')
    await tick()
    expect(seen.length).toBe(1)
  })

  it('click on a day picks it; out-of-range days are ignored', async () => {
    await open(' value="2024-03-15" min="2024-03-10" max="2024-03-20"')
    expect(day('2024-03-05')!.getAttribute('aria-disabled')).toBe('true')
    day('2024-03-05')!.click()
    expect(root().value).toBe('2024-03-15')
    day('2024-03-18')!.click()
    await tick()
    expect(root().value).toBe('2024-03-18')
  })

  it('keyboard clamps to min/max; month nav buttons disable at the bounds', async () => {
    await open(' value="2024-03-15" min="2024-03-10" max="2024-03-20"')
    key(day('2024-03-15')!, 'PageDown')
    await tick()
    expect(cursorDay()).toBe('2024-03-20') // clamped to max, never beyond
    const [prev, next] = [...document.querySelectorAll<HTMLButtonElement>('[data-nav]')]
    expect(prev!.disabled).toBe(true)
    expect(next!.disabled).toBe(true)
  })

  it('month nav buttons step the view', async () => {
    await open()
    const [prev, next] = [...document.querySelectorAll<HTMLButtonElement>('[data-nav]')]
    next!.click()
    await tick()
    expect(monthLabel()).toBe('April 2024')
    prev!.click()
    prev!.click()
    await tick()
    expect(monthLabel()).toBe('February 2024')
    expect(prev!.getAttribute('aria-label')).toBe('Previous month')
  })

  it('Escape in the dialog closes it and refocuses the input', async () => {
    await open()
    expect(key(day('2024-03-15')!, 'Escape').defaultPrevented).toBe(true)
    await tick()
    expect(root().isOpen).toBe(false)
    expect(document.activeElement).toBe(input())
  })

  it('a typed date commits on Enter and on blur; an invalid one reverts', async () => {
    await mount(' value="2024-03-15"')
    const seen: unknown[] = []
    root().addEventListener('cv-value-change', (e) => seen.push((e as CustomEvent).detail))
    const typeText = (text: string) => {
      input().value = text
      input().dispatchEvent(new Event('input', { bubbles: true }))
    }
    typeText('2024-05-02')
    key(input(), 'Enter')
    await tick()
    expect(root().value).toBe('2024-05-02')
    typeText('2024-06-07')
    input().dispatchEvent(new FocusEvent('focusout', { bubbles: true }))
    await tick()
    expect(root().value).toBe('2024-06-07')
    typeText('not a date')
    key(input(), 'Enter')
    await tick()
    expect(root().value).toBe('2024-06-07')
    expect(input().value).not.toBe('not a date')
    expect(seen).toEqual([{ value: '2024-05-02' }, { value: '2024-06-07' }])
  })

  it('clearing the text clears the value', async () => {
    await mount()
    input().value = ''
    input().dispatchEvent(new Event('input', { bubbles: true }))
    key(input(), 'Enter')
    await tick()
    expect(root().value).toBe('')
    expect(state(root()).value).toBe('')
  })

  it('disabled blocks opening', async () => {
    await mount(' value="2024-03-15" disabled')
    expect(input().disabled).toBe(true)
    openButton().click()
    await tick()
    expect(root().isOpen).toBe(false)
  })

  it('form reset restores the initial value', async () => {
    await mount()
    root().value = '2024-07-01'
    await tick()
    expect(state(root()).value).toBe('2024-07-01')
    form().reset()
    await tick()
    expect(root().value).toBe('2024-03-15')
    expect(state(root()).value).toBe('2024-03-15')
  })

  it('required: invalid while empty with the message, valid once picked, invalid after reset', async () => {
    await mount(' required')
    expect(input().getAttribute('aria-required')).toBe('true')
    expect(state(root()).missing).toBe(true)
    expect(state(root()).message).toBe('Please fill out this field.')
    root().value = '2024-03-15'
    await tick()
    expect(state(root()).missing).toBe(false)
    form().reset()
    await tick()
    expect(state(root()).missing).toBe(true)
  })

  it('a non-ISO value property clears instead of storing garbage', async () => {
    await mount()
    root().value = '15/03/2024'
    expect(root().value).toBe('')
  })

  it('survives an idiomorph morph back to the server markup (open and closed)', async () => {
    await open()
    key(day('2024-03-15')!, 'ArrowRight')
    await tick()
    key(day('2024-03-16')!, 'Enter')
    await tick()
    Idiomorph.morph(form(), html(' value="2024-03-15"'), { morphStyle: 'outerHTML' })
    await tick()
    expect(root().value).toBe('2024-03-16')
    expect(input().value).toMatch(/16/)
    openButton().click()
    await tick()
    expect(root().isOpen).toBe(true)
    Idiomorph.morph(form(), html(' value="2024-03-15"'), { morphStyle: 'outerHTML' })
    await tick()
    expect(root().isOpen).toBe(true)
    expect(document.querySelectorAll('[data-day]').length).toBe(31)
    expect(day('2024-03-16')!.getAttribute('aria-selected')).toBe('true')
    day('2024-03-20')!.click()
    await tick()
    expect(root().value).toBe('2024-03-20')
  })

  it('is axe clean closed and open', async () => {
    const opts = {
      runOnly: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'],
      rules: { 'color-contrast': { enabled: false } },
    }
    await mount()
    expect((await axe.run(document.body, opts)).violations.map((v) => v.id)).toEqual([])
    openButton().click()
    await tick()
    expect((await axe.run(document.body, opts)).violations.map((v) => v.id)).toEqual([])
  })
})
