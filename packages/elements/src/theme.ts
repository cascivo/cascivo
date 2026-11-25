import { signal } from '@preact/signals-core'
import { CvElement, define as defineTag, set, targetOf } from './base.ts'

const BUTTON = '[data-cv-theme-value]'

/**
 * `<cv-theme>`: runtime theme (or density) switcher around a `<select>` or a set of
 * `[data-cv-theme-value]` buttons (`aria-pressed` marks the current one). Writes the choice to
 * an attribute on `<html>` (`attribute`, default `data-theme`, the one every theme CSS and the
 * no-flash `theme_script()` use) and persists it to `localStorage` (`storage-key`, default
 * `cascade-theme`) in the versioned envelope `{"v":1,"value":…}` that script reads, so a
 * reload never flashes. A bare string written by older code is read too. On connect it
 * restores the stored value, else keeps what `<html>` already carries, else the control's own.
 * For density use `attribute="data-density" storage-key="cascade-density"`.
 * Fires `cv-theme-change` (`detail.value`) when the user picks.
 */
export class CvTheme extends CvElement {
  readonly value = signal<string | undefined>(undefined)

  constructor() {
    super()
    this.addEventListener('change', (e) => {
      const t = targetOf(e)
      if (t instanceof HTMLSelectElement) this.pick(t.value)
    })
    this.addEventListener('click', (e) => {
      const b = targetOf(e).closest<HTMLElement>(BUTTON)
      if (b) this.pick(b.dataset['cvThemeValue'] ?? '')
    })
  }

  get #attr(): string {
    return this.getAttribute('attribute') ?? 'data-theme'
  }

  get #key(): string {
    return this.getAttribute('storage-key') ?? 'cascade-theme'
  }

  pick(value: string): void {
    if (!value) return
    // Persist even an unchanged pick: choosing what the OS default painted pins it.
    try {
      localStorage.setItem(this.#key, JSON.stringify({ v: 1, value }))
    } catch {
      /* storage blocked: the choice still applies for this page */
    }
    if (value === this.value.peek()) return
    this.value.value = value
    this.emit('cv-theme-change', { value })
  }

  connectedCallback(): void {
    if (this.value.peek() === undefined) {
      let stored: string | undefined
      try {
        const raw = localStorage.getItem(this.#key)
        if (raw) {
          stored = raw
          try {
            const e: unknown = JSON.parse(raw)
            if (e && typeof e === 'object' && 'value' in e) stored = String(e.value)
          } catch {
            /* a bare string */
          }
        }
      } catch {
        /* storage blocked */
      }
      this.value.value =
        stored ||
        document.documentElement.getAttribute(this.#attr) ||
        this.$<HTMLSelectElement>('select')?.value ||
        this.$(`${BUTTON}[aria-pressed="true"]`)?.getAttribute('data-cv-theme-value') ||
        undefined
    }
    super.connectedCallback()
  }

  protected render(): void {
    const v = this.value.value
    if (v === undefined) return
    set(document.documentElement, this.#attr, v)
    const select = this.$<HTMLSelectElement>('select')
    if (select && select.value !== v) select.value = v
    for (const b of this.$$(BUTTON))
      set(b, 'aria-pressed', String(b.getAttribute('data-cv-theme-value') === v))
  }
}

export function define(): void {
  defineTag('cv-theme', CvTheme)
}
