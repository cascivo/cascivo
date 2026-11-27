import { signal } from '@preact/signals-core'
import { CvElement, define as defineTag, set, targetOf } from './base.ts'

const OPTION = '[role="option"]'
const OPENER = '[data-cv-command-open]'
const disabled = (row: Element) => row.getAttribute('aria-disabled') === 'true'

/** `mod+k` / `ctrl+shift+p`: `mod` is Cmd or Ctrl, whichever the platform uses. */
function matches(shortcut: string, e: KeyboardEvent): boolean {
  const parts = shortcut.toLowerCase().split('+')
  const key = parts.pop()
  const has = (m: string) => parts.includes(m)
  return (
    e.key.toLowerCase() === key &&
    (has('mod')
      ? e.metaKey || e.ctrlKey
      : e.metaKey === has('meta') && e.ctrlKey === has('ctrl')) &&
    e.shiftKey === has('shift') &&
    e.altKey === has('alt')
  )
}

/**
 * `<cv-command-menu>`: enhances the markup `CommandMenu` renders (a `<dialog>` holding an
 * `input[role=combobox]`, a `[role=listbox]` of `[role=option]` rows and optionally an
 * `.cv-command-menu-empty` / `[data-cv-command-empty]` element). Opens on `shortcut` (default
 * `mod+k`) or `[data-cv-command-open]`; the input filters rows (`data-search`, else their text)
 * by hiding them; focus stays in the input and the active row is `aria-activedescendant`.
 * Enter clicks the active row, so an anchor or `hx-get` row works natively; every activation
 * also fires `cv-select` (`detail.value` = `data-value`, else its text) and closes.
 * Fires `cv-open` / `cv-close`.
 */
export class CvCommandMenu extends CvElement {
  readonly state = signal(false)
  readonly query = signal('')
  readonly active = signal(0)
  #off: (() => void) | undefined

  constructor() {
    super()
    this.addEventListener('input', (e) => {
      this.query.value = (targetOf(e) as HTMLInputElement).value
      this.active.value = 0
    })
    this.addEventListener('click', (e) => {
      const t = targetOf(e)
      const row = t.closest<HTMLElement>(OPTION)
      if (row && !disabled(row)) {
        this.emit('cv-select', { value: row.dataset['value'] ?? row.textContent?.trim() ?? '' })
        this.close()
      } else if (t.localName === 'dialog') this.close()
    })
    this.addEventListener('mouseover', (e) => {
      const row = targetOf(e).closest<HTMLElement>(OPTION)
      const i = row ? this.#rows().indexOf(row) : -1
      if (i >= 0) this.active.value = i
    })
    this.addEventListener('keydown', (e) => {
      const rows = this.#rows()
      const i = this.active.peek()
      const move = (to: number) => {
        e.preventDefault()
        this.active.value = rows.length ? (to + rows.length) % rows.length : 0
      }
      if (e.key === 'ArrowDown') move(i + 1)
      else if (e.key === 'ArrowUp') move(i - 1)
      else if (e.key === 'Home') move(0)
      else if (e.key === 'End') move(-1)
      else if (e.key === 'Enter' && rows[i]) {
        e.preventDefault()
        rows[i]!.click()
      } else if (e.key === 'Escape') {
        e.preventDefault()
        this.close()
      }
    })
    // Native Escape / form[method=dialog] close the dialog without going through close().
    this.addEventListener('close', () => this.#shut(), true)
    this.addEventListener('cancel', () => this.#shut(), true)
  }

  get open(): boolean {
    return this.state.value
  }

  show(): void {
    if (this.state.peek()) return
    const input = this.$<HTMLInputElement>('input')
    if (input) input.value = ''
    this.query.value = ''
    this.active.value = 0
    this.state.value = true
    this.emit('cv-open')
  }

  close(): void {
    this.#shut()
  }

  #shut(): boolean {
    if (!this.state.peek()) return false
    this.state.value = false
    this.emit('cv-close')
    return true
  }

  connectedCallback(): void {
    super.connectedCallback()
    this.#off?.()
    const onKey = (e: KeyboardEvent) => {
      if (!matches(this.getAttribute('shortcut') ?? 'mod+k', e)) return
      e.preventDefault()
      if (this.state.peek()) this.close()
      else this.show()
    }
    const onClick = (e: MouseEvent) => {
      if (targetOf(e).closest(OPENER)) this.show()
    }
    document.addEventListener('keydown', onKey)
    document.addEventListener('click', onClick)
    this.#off = () => {
      document.removeEventListener('keydown', onKey)
      document.removeEventListener('click', onClick)
    }
  }

  disconnectedCallback(): void {
    super.disconnectedCallback()
    this.#off?.()
    this.#off = undefined
  }

  #match(row: Element): boolean {
    const text = ((row as HTMLElement).dataset['search'] ?? row.textContent ?? '').toLowerCase()
    return this.query.value
      .toLowerCase()
      .split(/\s+/)
      .filter(Boolean)
      .every((w) => text.includes(w))
  }

  /** Rows that survive the filter and are enabled, in document order: the arrow-key targets. */
  #rows(): HTMLElement[] {
    return this.$$(OPTION).filter((row) => !disabled(row) && this.#match(row))
  }

  protected render(): void {
    const dialog = this.$<HTMLDialogElement>('dialog')
    const input = this.$<HTMLInputElement>('input')
    if (!dialog || !input) return
    const open = this.state.value
    const rows = this.#rows()
    const active = rows[Math.min(this.active.value, rows.length - 1)]
    const all = this.$$(OPTION)
    all.forEach((row, i) => {
      set(row, 'id', row.id || `${this.uid}-o${i}`)
      set(row, 'hidden', this.#match(row) ? null : '')
      set(row, 'aria-selected', String(row === active))
    })
    const list = this.$('[role="listbox"]')
    set(input, 'role', 'combobox')
    set(input, 'aria-autocomplete', 'list')
    set(input, 'aria-expanded', String(open))
    set(input, 'aria-controls', list?.id || null)
    set(input, 'aria-activedescendant', active?.id ?? null)
    set(
      this.$('[data-cv-command-empty], [class$="-empty"]'),
      'hidden',
      all.some((row) => this.#match(row)) ? '' : null,
    )
    if (open === dialog.open) return
    // jsdom has no showModal; the `open` attribute carries the state there.
    if (!open) {
      if (typeof dialog.close === 'function') dialog.close()
      else dialog.removeAttribute('open')
    } else if (typeof dialog.showModal === 'function') dialog.showModal()
    else dialog.setAttribute('open', '')
    if (open) input.focus()
  }
}

export function define(): void {
  defineTag('cv-command-menu', CvCommandMenu)
}
