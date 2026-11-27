import { signal } from '@preact/signals-core'
import { CvElement, define as defineTag, set } from './base.ts'

/**
 * `<cv-tooltip>`: enhances the markup `Tooltip` renders (a trigger and a
 * `[role=tooltip][popover=manual]` sibling). Hover or keyboard focus on the trigger shows it
 * after `delay` ms (default 200); leave, blur or Escape hides it at once. The trigger gets
 * `aria-describedby` while it is visible. The tooltip never takes focus or pointer events.
 * CSS alone cannot do this: a `popover=manual` panel needs `showPopover()`, and the delay and
 * Escape (WCAG 1.4.13 dismissable) need script.
 */
export class CvTooltip extends CvElement {
  readonly visible = signal(false)
  #timer: ReturnType<typeof setTimeout> | undefined

  constructor() {
    super()
    const show = () => {
      clearTimeout(this.#timer)
      const delay = Number(this.getAttribute('delay') ?? 200)
      this.#timer = setTimeout(() => (this.visible.value = true), delay)
    }
    const hide = () => {
      clearTimeout(this.#timer)
      this.visible.value = false
    }
    this.addEventListener('mouseover', show)
    this.addEventListener('mouseout', (e) => {
      if (!this.contains(e.relatedTarget as Node | null)) hide()
    })
    this.addEventListener('focusin', show)
    this.addEventListener('focusout', hide)
    this.addEventListener('keydown', (e) => e.key === 'Escape' && hide())
  }

  disconnectedCallback(): void {
    super.disconnectedCallback()
    clearTimeout(this.#timer)
  }

  protected render(): void {
    const tip = this.$('[role="tooltip"]')
    if (!tip) return
    const on = this.visible.value
    const trigger = Array.from(this.querySelectorAll('*')).find(
      (el) => el !== tip && !tip.contains(el) && !el.contains(tip),
    )
    set(tip, 'id', tip.id || `${this.uid}-tip`)
    set(tip, 'popover', 'manual')
    set(tip, 'data-state', on ? 'visible' : 'hidden')
    set(trigger, 'aria-describedby', on ? tip.id : null)
    // jsdom has no Popover API; data-state still shows the tip.
    if (typeof tip.showPopover !== 'function' || tip.matches(':popover-open') === on) return
    if (on) tip.showPopover()
    else tip.hidePopover()
  }
}

export function define(): void {
  defineTag('cv-tooltip', CvTooltip)
}
