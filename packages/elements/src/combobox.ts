import { t } from '@cascivo/i18n'
import { batch, signal } from '@preact/signals-core'
import { CvFormElement, define as defineTag, set, targetOf } from './base.ts'
import { combobox as msg, elements } from './messages.ts'

/**
 * `<cv-combobox>`: the editable (searchable) `Combobox`, form-associated. Options are the
 * `[role="option"][data-value]` rows already in the markup; typing filters them (`hidden`).
 * Keyboard per the APG editable combobox with list autocomplete.
 */
export class CvCombobox extends CvFormElement {
  readonly query = signal('')
  /** Index into `#options()` (all rows, DOM order); -1 for none. */
  readonly active = signal(-1)

  constructor() {
    super()
    this.addEventListener('keydown', (e) => this.#onKey(e))
    this.addEventListener('input', (e) => {
      const input = targetOf(e)
      if (!(input instanceof HTMLInputElement)) return
      batch(() => {
        this.query.value = input.value
        this.send('OPEN')
        this.active.value = this.#visible()[0] ?? -1
      })
    })
    // Keep focus in the field; the selection happens on click (what AT synthesises too).
    this.addEventListener('mousedown', (e) => {
      if (targetOf(e).closest('[role="option"]')) e.preventDefault()
    })
    this.addEventListener('click', (e) => {
      const t = targetOf(e)
      const row = t.closest<HTMLElement>('[role="option"]')
      if (row) return this.#pick(this.#options().indexOf(row))
      if (t.closest('[role="combobox"]') && !this.isOpen) this.#openList()
    })
  }

  #options(): HTMLElement[] {
    return this.$$('[role="option"]')
  }

  #enabled(row: HTMLElement | undefined): boolean {
    return !!row && row.getAttribute('aria-disabled') !== 'true'
  }

  /** Indexes of rows that match the query and are enabled, in DOM order. */
  #visible(): number[] {
    const q = this.query.peek().trim().toLowerCase()
    return this.#options().flatMap((row, i) =>
      this.#enabled(row) && (row.textContent ?? '').toLowerCase().includes(q) ? [i] : [],
    )
  }

  #openList(seedLast = false): void {
    if (this.hasAttribute('disabled')) return
    const visible = this.#visible()
    const selected = this.#options().findIndex((r) => r.dataset['value'] === this.current.peek())
    batch(() => {
      this.active.value = visible.includes(selected)
        ? selected
        : ((seedLast ? visible.at(-1) : visible[0]) ?? -1)
      this.send('OPEN')
    })
  }

  protected close(focus = true): void {
    batch(() => {
      this.query.value = ''
      this.active.value = -1
      super.close(focus)
    })
  }

  #pick(index: number): void {
    const row = this.#options()[index]
    if (!this.#enabled(row)) return
    const value = row!.dataset['value'] ?? ''
    this.close()
    if (value !== this.value) this.setValue(value)
  }

  #move(delta: 1 | -1): void {
    const visible = this.#visible()
    if (visible.length === 0) return
    const at = visible.indexOf(this.active.peek())
    const next = at === -1 ? (delta > 0 ? 0 : -1) : at + delta
    this.active.value = visible.at(next % visible.length) ?? -1
  }

  #onKey(e: KeyboardEvent): void {
    if (!targetOf(e).closest('[role="combobox"]') || this.hasAttribute('disabled')) return
    const open = this.isOpen
    const key = e.altKey ? `Alt${e.key}` : e.key
    switch (key) {
      case 'AltArrowDown':
        e.preventDefault()
        if (!open) this.#openList()
        return
      case 'AltArrowUp':
        e.preventDefault()
        if (open) this.close()
        return
      case 'ArrowDown':
      case 'ArrowUp':
        e.preventDefault()
        if (!open) this.#openList(key === 'ArrowUp')
        else this.#move(key === 'ArrowDown' ? 1 : -1)
        return
      case 'Enter':
        if (!open) return
        e.preventDefault()
        if (this.active.peek() >= 0) this.#pick(this.active.peek())
        return
      case 'Escape':
        if (!open) return
        e.preventDefault()
        e.stopPropagation()
        this.close()
        return
      case 'Tab':
        if (open) this.close(false)
    }
  }

  protected render(): void {
    const input = this.$<HTMLInputElement>('[role="combobox"]')
    const listbox = this.$('[role="listbox"]')
    if (!input || !listbox) return
    const open = this.isOpen
    const query = this.query.value.trim().toLowerCase()
    const active = this.active.value
    const value = this.current.value
    const rows = this.#options()
    const listId = listbox.id || `${this.uid}-listbox`
    let matches = 0
    let selectedLabel = ''
    rows.forEach((row, i) => {
      const label = row.textContent?.trim() ?? ''
      const match = label.toLowerCase().includes(query)
      if (match) matches++
      if (row.dataset['value'] === value) selectedLabel = label
      set(row, 'id', row.id || `${this.uid}-option-${i}`)
      set(row, 'aria-selected', String(row.dataset['value'] === value))
      set(row, 'data-state', i === active ? 'active' : null)
      set(row, 'hidden', match ? null : '')
    })
    const activeRow = open ? rows[active] : undefined
    activeRow?.scrollIntoView?.({ block: 'nearest' })

    set(listbox, 'id', listId)
    if (!listbox.hasAttribute('aria-label') && !listbox.hasAttribute('aria-labelledby'))
      set(listbox, 'aria-labelledby', this.$('label')?.id || null)
    set(input, 'aria-activedescendant', activeRow?.id ?? null)
    const text = open ? this.query.value : selectedLabel
    this.renderField(input, listId, text, t(msg.placeholder), t(elements.valueMissing))
    set(this.$('.cv-combobox-popup'), 'data-state', open ? 'open' : 'closed')
    const empty = this.$('.cv-combobox-empty')
    set(empty, 'hidden', matches === 0 ? null : '')
    if (empty && empty.textContent !== t(msg.empty)) empty.textContent = t(msg.empty)
    const status = this.$('[aria-live]')
    const announce = open ? t(msg.resultCount, { count: String(matches) }) : ''
    if (status && status.textContent !== announce) status.textContent = announce
  }
}

export function define(): void {
  defineTag('cv-combobox', CvCombobox)
}
