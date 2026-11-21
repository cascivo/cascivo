import { createMachine, transition } from '@cascivo/core/pure'
import { signal } from '@preact/signals-core'
import { CvElement, define as defineTag, set, targetOf } from './base.ts'

const machine = createMachine({
  initial: 'closed',
  states: {
    closed: { on: { TOGGLE: 'open', OPEN: 'open' } },
    open: { on: { TOGGLE: 'closed', CLOSE: 'closed' } },
  },
})

const ITEM = '[role="menuitem"]:not([aria-disabled="true"])'

/**
 * `<cv-menu>`: enhances the markup `Menu` renders (a `[aria-haspopup="menu"]` button and a
 * `[role="menu"][popover="auto"]` panel of `[role="menuitem"]` rows). Fires `cv-select`
 * (`detail.value` = the item's `data-value`, else its text) and closes.
 */
export class CvMenu extends CvElement {
  readonly state = signal(machine.initial)
  #buffer = ''
  #bufferAt = 0

  constructor() {
    super()
    this.addEventListener('click', (e) => {
      const t = targetOf(e)
      if (t.closest('[aria-haspopup="menu"]')) return this.#send('TOGGLE')
      const item = t.closest<HTMLElement>(ITEM)
      if (item) this.#activate(item)
    })
    this.addEventListener('keydown', (e) => this.#onKey(e))
    // Light dismiss (outside click, Escape) closes the popover natively; follow it. `toggle`
    // does not bubble, so listen in the capture phase.
    this.addEventListener(
      'toggle',
      (e) => (e as ToggleEvent).newState === 'closed' && this.#send('CLOSE'),
      true,
    )
  }

  get open(): boolean {
    return this.state.value === 'open'
  }

  #send(event: string): void {
    const was = this.state.value
    this.state.value = transition(machine, was, event)
    if (was !== 'open' && this.open) queueMicrotask(() => this.#items()[0]?.focus())
  }

  #items(): HTMLElement[] {
    return this.$$(ITEM)
  }

  #close(): void {
    this.#send('CLOSE')
    this.$('[aria-haspopup="menu"]')?.focus()
  }

  #activate(item: HTMLElement): void {
    this.emit('cv-select', { value: item.dataset['value'] ?? item.textContent?.trim() ?? '' })
    this.#close()
  }

  #onKey(e: KeyboardEvent): void {
    const t = targetOf(e)
    if (t.closest('[aria-haspopup="menu"]')) {
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        e.preventDefault()
        this.#send('OPEN')
      }
      return
    }
    const items = this.#items()
    const i = items.indexOf(t as HTMLElement)
    const move = (to: number) => {
      e.preventDefault()
      items[(to + items.length) % items.length]?.focus()
    }
    switch (e.key) {
      case 'ArrowDown':
        return move(i + 1)
      case 'ArrowUp':
        return move(i < 0 ? -1 : i - 1)
      case 'Home':
        return move(0)
      case 'End':
        return move(-1)
      case 'Escape':
        e.preventDefault()
        return this.#close()
      case 'Tab':
        return this.#send('CLOSE')
      case 'Enter':
      case ' ':
        if (i < 0) return
        e.preventDefault()
        return this.#activate(items[i]!)
    }
    // Typeahead: printable keys accumulate for 500 ms, focus the first label that starts so.
    if (e.key.length !== 1 || e.ctrlKey || e.metaKey || e.altKey) return
    const now = Date.now()
    this.#buffer = (now - this.#bufferAt > 500 ? '' : this.#buffer) + e.key.toLowerCase()
    this.#bufferAt = now
    items.find((el) => el.textContent?.trim().toLowerCase().startsWith(this.#buffer))?.focus()
  }

  protected render(): void {
    const trigger = this.$('[aria-haspopup="menu"]')
    const panel = this.$('[role="menu"]')
    if (!trigger || !panel) return
    const open = this.open
    const id = panel.id || `${this.uid}-menu`
    const anchor = `--${this.uid}-anchor`
    set(panel, 'id', id)
    set(panel, 'popover', 'auto')
    set(panel, 'data-state', open ? 'open' : 'closed')
    set(trigger, 'aria-controls', id)
    set(trigger, 'aria-expanded', String(open))
    if (trigger.style.getPropertyValue('anchor-name') !== anchor) {
      trigger.style.setProperty('anchor-name', anchor)
      panel.style.setProperty('position-anchor', anchor)
    }
    for (const item of this.$$('[role="menuitem"]'))
      set(item, 'tabindex', item.getAttribute('aria-disabled') === 'true' ? '-1' : '0')
    // jsdom has no Popover API; the open state is still carried by aria-expanded/data-state.
    if (typeof panel.showPopover !== 'function' || panel.matches(':popover-open') === open) return
    if (open) panel.showPopover()
    else panel.hidePopover()
  }
}

export function define(): void {
  defineTag('cv-menu', CvMenu)
}
