import { batch, signal } from '@preact/signals-core'
import { define as defineTag, set, targetOf } from './base.ts'
import { CvChips, syncChips } from './chips.ts'

const P = '.cv-multi-select-'
const ROW = '[role="option"]'

/**
 * `<cv-multi-select>`: the `MultiSelect` markup (chips + trigger + `popover` panel with a
 * search box and a `[role=listbox][aria-multiselectable]` of `[role=option]` rows, `data-value`
 * else text), form-associated: submits one `name` entry per value. Attributes: `name`,
 * `required`, `disabled`, `placeholder`, `selected-label` (`{count} selected`), `remove-label`
 * (`Remove {label}`). Typing filters, Backspace on an empty search drops the last chip.
 */
export class CvMultiSelect extends CvChips {
  readonly open = signal(false)
  readonly query = signal('')
  /** Index into the rows (DOM order); -1 for none. */
  readonly active = signal(-1)
  #was: boolean | undefined

  constructor() {
    super()
    // A press on the trigger light-dismisses an open panel before the click arrives; remember
    // the state it had so the click closes rather than reopens.
    this.addEventListener('pointerdown', (e) => {
      if (targetOf(e).closest(`${P}trigger`)) this.#was = this.open.peek()
    })
    this.addEventListener('click', (e) => {
      const t = targetOf(e)
      const row = t.closest<HTMLElement>(ROW)
      const chip = t.closest<HTMLElement>(`${P}chip-remove`)?.parentElement
      if (this.hasAttribute('disabled')) return
      if (chip) this.commit(this.values.peek().filter((v) => v !== chip.dataset['value']))
      else if (t.closest(`${P}clear`)) this.commit([])
      else if (t.closest(`${P}select-all`)) {
        const vals = this.#rows()
          .filter((r) => this.#on(r))
          .map((r) => this.#val(r))
        this.commit(vals.every((v) => this.values.peek().includes(v)) ? [] : vals)
      } else if (row) this.#toggle(row)
      else if (t.closest(`${P}trigger`)) {
        const next = !(this.#was ?? this.open.peek())
        this.#was = undefined
        if (next) this.#show()
        else this.#hide()
      }
    })
    this.addEventListener('input', (e) => {
      const input = targetOf(e)
      if (!input.matches(`${P}search`)) return
      batch(() => {
        this.query.value = (input as HTMLInputElement).value
        this.active.value = this.#visible()[0] ?? -1
      })
    })
    // Keep focus in the search box; the selection happens on click.
    this.addEventListener('mousedown', (e) => targetOf(e).closest(ROW) && e.preventDefault())
    // Light dismiss (outside click, Escape) closes the popover natively; follow it.
    this.addEventListener(
      'toggle',
      (e) => (e as ToggleEvent).newState === 'closed' && this.#hide(false),
      true,
    )
    this.addEventListener('keydown', (e) => this.#onKey(e))
  }

  protected initial(): string[] {
    return this.#rows()
      .filter((r) => r.getAttribute('aria-selected') === 'true')
      .map((r) => this.#val(r))
  }

  #rows(): HTMLElement[] {
    return this.$$(ROW)
  }

  #val(row: HTMLElement): string {
    return row.dataset['value'] ?? row.textContent?.trim() ?? ''
  }

  #on(row: HTMLElement | undefined): row is HTMLElement {
    return !!row && row.getAttribute('aria-disabled') !== 'true'
  }

  /** Indexes of enabled rows matching the query, in DOM order. */
  #visible(): number[] {
    const q = this.query.peek().trim().toLowerCase()
    return this.#rows().flatMap((r, i) =>
      this.#on(r) && (r.textContent ?? '').toLowerCase().includes(q) ? [i] : [],
    )
  }

  #toggle(row: HTMLElement | undefined): void {
    if (!this.#on(row)) return
    const v = this.#val(row)
    const cur = this.values.peek()
    this.commit(cur.includes(v) ? cur.filter((x) => x !== v) : [...cur, v])
  }

  #show(): void {
    if (this.hasAttribute('disabled')) return
    batch(() => {
      this.active.value = this.#visible()[0] ?? -1
      this.open.value = true
    })
    queueMicrotask(() =>
      (this.$<HTMLElement>(`${P}search`) ?? this.$<HTMLElement>('[role="listbox"]'))?.focus(),
    )
  }

  #hide(focus = true): void {
    batch(() => {
      this.open.value = false
      this.query.value = ''
      this.active.value = -1
    })
    if (focus) this.$(`${P}trigger`)?.focus()
  }

  #onKey(e: KeyboardEvent): void {
    const t = targetOf(e)
    const chips = this.$(`${P}field`)?.dataset['display'] === 'chips'
    const typed = t instanceof HTMLInputElement && t.value !== ''
    if (e.key === 'Backspace') {
      const cur = this.values.peek()
      if (chips && !typed && cur.length && !this.hasAttribute('disabled')) {
        if (!t.closest(`${P}trigger, ${P}search`)) return
        e.preventDefault()
        this.commit(cur.slice(0, -1))
      }
    } else if (t.closest(`${P}trigger`)) {
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        e.preventDefault()
        this.#show()
      }
    } else if (t.closest(`${P}panel`) && this.open.peek()) {
      const vis = this.#visible()
      const at = vis.indexOf(this.active.peek())
      const go = (i: number) => {
        e.preventDefault()
        this.active.value = vis.at(i % (vis.length || 1)) ?? -1
      }
      const row = this.#rows()[this.active.peek()]
      switch (e.key) {
        case 'ArrowDown':
          return go(at + 1)
        case 'ArrowUp':
          return go(at < 0 ? -1 : at - 1)
        case 'Home':
          return go(0)
        case 'End':
          return go(-1)
        case 'Enter':
          if (t.matches(`${P}select-all`)) return
          e.preventDefault()
          return this.#toggle(row)
        case ' ':
          if (t.matches('input') || !row) return
          e.preventDefault()
          return this.#toggle(row)
        case 'Escape':
          e.preventDefault()
          e.stopPropagation()
          return this.#hide()
        case 'Tab':
          return this.#hide(false)
      }
    }
  }

  protected render(): void {
    const trigger = this.$(`${P}trigger`)
    const panel = this.$(`${P}panel`)
    const list = this.$('[role="listbox"]')
    if (!trigger || !panel || !list) return
    const off = this.hasAttribute('disabled')
    const open = this.open.value && !off
    const q = this.query.value.trim().toLowerCase()
    const active = this.active.value
    const sel = this.values.value
    const rows = this.#rows()
    const search = this.$<HTMLInputElement>(`${P}search`)
    let matches = 0
    const labels: Record<string, string> = {}
    rows.forEach((row, i) => {
      const label = row.textContent?.trim() ?? ''
      const v = this.#val(row)
      const match = label.toLowerCase().includes(q)
      matches += +match
      labels[v] = label
      set(row, 'id', row.id || `${this.uid}-option-${i}`)
      set(row, 'aria-selected', String(sel.includes(v)))
      set(row, 'data-selected', sel.includes(v) ? '' : null)
      set(row, 'data-active', open && i === active ? '' : null)
      set(row, 'hidden', match ? null : '')
    })
    const panelId = panel.id || `${this.uid}-panel`
    const listId = list.id || `${this.uid}-listbox`
    const anchor = `--${this.uid}-anchor`
    set(panel, 'id', panelId)
    set(panel, 'popover', 'auto')
    set(panel, 'data-state', open ? 'open' : 'closed')
    set(list, 'id', listId)
    set(list, 'aria-multiselectable', 'true')
    set(trigger, 'aria-haspopup', 'listbox')
    set(trigger, 'aria-controls', panelId)
    set(trigger, 'aria-expanded', String(open))
    set(trigger, 'disabled', off ? '' : null)
    set(search ?? list, 'aria-activedescendant', (open && rows[active]?.id) || null)
    if (search) {
      set(search, 'aria-expanded', String(open))
      set(search, 'aria-controls', listId)
      set(search, 'aria-autocomplete', 'list')
      if (search.value !== this.query.value) search.value = this.query.value
    }
    const wrapper = this.$(`${P}wrapper`)
    if (wrapper?.dataset['state'] !== 'error') set(wrapper, 'data-state', open ? 'open' : 'closed')
    if (trigger.style.getPropertyValue('anchor-name') !== anchor) {
      trigger.style.setProperty('anchor-name', anchor)
      panel.style.setProperty('position-anchor', anchor)
    }
    set(this.$(`${P}status`), 'hidden', matches ? '' : null)
    const enabled = rows.filter((r) => this.#on(r))
    set(
      this.$(`${P}select-all`),
      'aria-pressed',
      String(enabled.length > 0 && enabled.every((r) => sel.includes(this.#val(r)))),
    )
    const clear = this.$(`${P}clear`)
    set(clear, 'hidden', sel.length ? null : '')
    set(clear, 'disabled', off ? '' : null)

    const field = this.$(`${P}field`)
    const chips = field?.dataset['display'] === 'chips'
    if (field && chips)
      syncChips(
        field,
        trigger,
        sel.map((v) => [v, labels[v] ?? v]),
        {
          chip: 'cv-multi-select-chip',
          label: 'cv-multi-select-chip-label',
          remove: 'cv-multi-select-chip-remove',
          text: this.getAttribute('remove-label') ?? 'Remove {label}',
          off,
        },
      )
    // The trigger names itself: the count, or (with chips showing) a screen-reader summary.
    const slot = this.$(`${P}trigger-label`)
    const text = sel.length
      ? (this.getAttribute('selected-label') ?? '{count} selected').replace(
          '{count}',
          String(sel.length),
        )
      : (this.getAttribute('placeholder') ?? 'Select options')
    const target = (chips && sel.length && slot?.querySelector(`${P}sr-only`)) || slot
    if (target && target.textContent !== text) target.textContent = text
    this.sync(trigger)
    // jsdom has no Popover API; the open state is still carried by aria-expanded/data-state.
    if (typeof panel.showPopover !== 'function' || panel.matches(':popover-open') === open) return
    if (open) panel.showPopover()
    else panel.hidePopover()
  }
}

export function define(): void {
  defineTag('cv-multi-select', CvMultiSelect)
}
