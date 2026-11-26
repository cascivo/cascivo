import { signal } from '@preact/signals-core'
import { CvElement, define as defineTag, set, targetOf } from './base.ts'

const TAB = '[role="tab"]'
const ENABLED = `${TAB}:not([disabled]):not([aria-disabled="true"])`

const valueOf = (tab: HTMLElement): string => tab.dataset['value'] ?? tab.id

/**
 * `<cv-tabs>`: enhances the markup `Tabs` renders (a `[role="tablist"]` of `[role="tab"]`
 * controlling `[role="tabpanel"]` rows). Arrow/Home/End roving focus (APG); the arrow keys
 * activate too unless `activation="manual"`. Fires `cv-value-change` (`detail.value` = the
 * tab's `data-value`, else its id).
 */
export class CvTabs extends CvElement {
  readonly current = signal<string | undefined>(undefined)

  constructor() {
    super()
    this.addEventListener('click', (e) => {
      const tab = targetOf(e).closest<HTMLElement>(ENABLED)
      if (tab && this.#own(tab)) this.#pick(tab)
    })
    this.addEventListener('keydown', (e) => {
      const tabs = this.#tabs(ENABLED)
      const i = tabs.indexOf(targetOf(e) as HTMLElement)
      const rtl = getComputedStyle(this).direction === 'rtl' ? -1 : 1
      const to = { ArrowRight: i + rtl, ArrowLeft: i - rtl, Home: 0, End: -1 }[e.key]
      const next = tabs[((to ?? 0) + tabs.length) % tabs.length]
      if (i < 0 || to === undefined || !next) return
      e.preventDefault()
      next.focus()
      if (this.getAttribute('activation') !== 'manual') this.#pick(next)
    })
  }

  /** Tabs of this element only: a nested `cv-tabs` keeps its own. */
  #own(el: Element): boolean {
    return el.closest('cv-tabs') === this
  }

  #tabs(selector: string): HTMLElement[] {
    return this.$$(selector).filter((el) => this.#own(el))
  }

  #pick(tab: HTMLElement): void {
    if (tab.getAttribute('aria-selected') === 'true') return
    this.current.value = valueOf(tab)
    this.emit('cv-value-change', { value: this.current.value })
  }

  protected render(): void {
    const tabs = this.#tabs(TAB)
    const want = this.current.value
    // Before any interaction the server's `aria-selected` rules; a value naming no tab
    // (a morph removed it) falls back the same way.
    const on =
      tabs.find((t) => valueOf(t) === want) ??
      tabs.find((t) => t.getAttribute('aria-selected') === 'true') ??
      tabs[0]
    const panels = this.#tabs('[role="tabpanel"]')
    for (const tab of tabs) {
      const state = tab === on ? 'active' : 'inactive'
      set(tab, 'aria-selected', String(tab === on))
      set(tab, 'data-state', state)
      set(tab, 'tabindex', tab === on ? '0' : '-1')
      const panel = panels.find((p) => p.id === tab.getAttribute('aria-controls'))
      set(panel, 'data-state', state)
      set(panel, 'hidden', tab === on ? null : '')
    }
  }
}

export function define(): void {
  defineTag('cv-tabs', CvTabs)
}
