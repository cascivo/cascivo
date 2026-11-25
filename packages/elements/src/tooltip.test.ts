import axe from 'axe-core'
import { Idiomorph } from 'idiomorph'
import { beforeAll, describe, expect, it } from 'vitest'
import { define } from './tooltip.ts'

const html = (attrs = '') => `<cv-tooltip id="tt"${attrs}><span class="cv-tooltip-root">
<button type="button" id="trg">Save</button>
<span role="tooltip" id="tip" data-placement="top" data-state="hidden" class="cv-tooltip-tooltip">Save the file</span></span></cv-tooltip>`

const tick = (ms = 0) => new Promise<void>((r) => setTimeout(r, ms))
const trg = () => document.getElementById('trg') as HTMLElement
const tip = () => document.getElementById('tip') as HTMLElement
async function mount(attrs = '') {
  document.body.innerHTML = html(attrs)
  await tick()
}
const fire = (el: Element, type: string, init: object = {}) =>
  el.dispatchEvent(
    new (type.startsWith('key') ? KeyboardEvent : MouseEvent)(type, { bubbles: true, ...init }),
  )

beforeAll(define)

describe('cv-tooltip', () => {
  it('wires the popover and starts hidden', async () => {
    await mount()
    expect(tip().getAttribute('popover')).toBe('manual')
    expect(tip().dataset['state']).toBe('hidden')
    expect(trg().hasAttribute('aria-describedby')).toBe(false)
  })

  it('shows after the delay on hover and hides on leave', async () => {
    await mount(' delay="20"')
    fire(trg(), 'mouseover')
    await tick(5)
    expect(tip().dataset['state']).toBe('hidden')
    await tick(30)
    expect(tip().dataset['state']).toBe('visible')
    expect(trg().getAttribute('aria-describedby')).toBe('tip')
    fire(trg(), 'mouseout', { relatedTarget: document.body })
    await tick()
    expect(tip().dataset['state']).toBe('hidden')
    expect(trg().hasAttribute('aria-describedby')).toBe(false)
  })

  it('a quick leave cancels the pending show', async () => {
    await mount(' delay="20"')
    fire(trg(), 'mouseover')
    fire(trg(), 'mouseout', { relatedTarget: document.body })
    await tick(40)
    expect(tip().dataset['state']).toBe('hidden')
  })

  it('shows on keyboard focus, Escape dismisses, blur hides', async () => {
    await mount(' delay="0"')
    trg().dispatchEvent(new FocusEvent('focusin', { bubbles: true }))
    await tick(5)
    expect(tip().dataset['state']).toBe('visible')
    fire(trg(), 'keydown', { key: 'Escape' })
    await tick()
    expect(tip().dataset['state']).toBe('hidden')
    trg().dispatchEvent(new FocusEvent('focusin', { bubbles: true }))
    await tick(5)
    trg().dispatchEvent(new FocusEvent('focusout', { bubbles: true }))
    await tick()
    expect(tip().dataset['state']).toBe('hidden')
  })

  it('survives an idiomorph morph while visible', async () => {
    await mount(' delay="0"')
    trg().dispatchEvent(new FocusEvent('focusin', { bubbles: true }))
    await tick(5)
    Idiomorph.morph(document.getElementById('tt')!, html(' delay="0"'), { morphStyle: 'outerHTML' })
    await tick()
    expect(tip().dataset['state']).toBe('visible')
  })

  it('is axe clean', async () => {
    await mount()
    const r = await axe.run(document.body, { rules: { region: { enabled: false } } })
    expect(r.violations.map((v) => v.id)).toEqual([])
  })
})
