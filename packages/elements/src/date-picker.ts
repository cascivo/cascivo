import { currentLocale, t } from '@cascivo/i18n'
import { batch, signal } from '@preact/signals-core'
// The same pure date helpers `Calendar` and `DatePicker` run, so both stacks agree on week
// starts, bounds, keyboard landing days and what a typed date means.
import {
  addDays,
  getMonthGrid,
  getWeekStart,
  localToday,
  moveByDays,
  moveByMonths,
  outOfRange,
  startOfWeek,
  viewStepBlocked,
} from '../../components/src/calendar/calendar-date.ts'
import {
  formatDate,
  fromISO,
  parseTypedDate,
  toISO,
} from '../../components/src/date-picker/parse-date.ts'
import { CvFormElement, define as defineTag, set, targetOf } from './base.ts'
import { calendar as calMsg, datePicker as msg, elements } from './messages.ts'

/**
 * `<cv-date-picker>`: the typeable `DatePicker`, form-associated (ISO `YYYY-MM-DD`). The
 * calendar grid is generated into the `[role="dialog"]` popup; keyboard per the APG date
 * picker dialog. `value` (initial), `min` and `max` are ISO dates.
 */
export class CvDatePicker extends CvFormElement {
  readonly draft = signal<string | null>(null)
  /** The roving cursor; its month is the month on view. */
  readonly cursor = signal<Date>(localToday())
  #focusGrid = false

  constructor() {
    super()
    this.addEventListener('input', (e) => {
      const t = targetOf(e)
      if (t instanceof HTMLInputElement) this.draft.value = t.value
    })
    this.addEventListener('click', (e) => {
      const t = targetOf(e)
      const day = t.closest<HTMLElement>('[data-day]')
      if (day) return this.#pick(day.dataset['day']!)
      const nav = t.closest<HTMLElement>('[data-nav]')
      if (nav) return this.#step(Number(nav.dataset['nav']))
      if (t.closest('.cv-date-picker-openButton')) {
        if (this.isOpen) this.close()
        else this.#openPopup()
      }
    })
    this.addEventListener('keydown', (e) => this.#onKey(e))
    this.addEventListener('focusout', (e) => targetOf(e) === this.#input() && this.#commitDraft())
  }

  #input(): HTMLInputElement | null {
    return this.$<HTMLInputElement>('[role="combobox"]')
  }

  #bounds() {
    return {
      min: fromISO(this.getAttribute('min') ?? '') ?? undefined,
      max: fromISO(this.getAttribute('max') ?? '') ?? undefined,
    }
  }

  /** Only a real ISO date is a value; anything else clears. */
  protected setValue(iso: string, quiet = false): void {
    const date = fromISO(iso)
    batch(() => {
      this.draft.value = null
      if (date) this.cursor.value = date
      super.setValue(date ? iso : '', quiet)
    })
  }

  #openPopup(): void {
    if (this.hasAttribute('disabled')) return
    this.#focusGrid = true
    this.send('OPEN')
  }

  #pick(iso: string): void {
    const date = fromISO(iso)
    const { min, max } = this.#bounds()
    if (!date || outOfRange(date, min, max)) return
    if (iso !== this.value) this.setValue(iso)
    this.close()
  }

  #commitDraft(): void {
    const text = this.draft.peek()
    if (text === null) return
    if (text.trim() === '') return this.setValue('')
    const { min, max } = this.#bounds()
    const year = fromISO(this.value)?.getUTCFullYear()
    const date = parseTypedDate(text, currentLocale(), year)
    if (date && !outOfRange(date, min, max)) this.setValue(toISO(date))
    else this.draft.value = null
  }

  #step(delta: number): void {
    const c = this.cursor.peek()
    const { min, max } = this.#bounds()
    if (viewStepBlocked(c.getUTCFullYear(), c.getUTCMonth(), delta, min, max)) return
    this.cursor.value = new Date(Date.UTC(c.getUTCFullYear(), c.getUTCMonth() + delta, 1))
  }

  #onKey(e: KeyboardEvent): void {
    const t = targetOf(e)
    if (t === this.#input()) {
      if (e.key === 'ArrowDown') {
        e.preventDefault()
        this.#openPopup()
      } else if (e.key === 'Enter') {
        e.preventDefault()
        this.#commitDraft()
      } else if (e.key === 'Escape') {
        if (this.isOpen) this.close()
        else this.draft.value = null
      }
      return
    }
    if (!t.closest('[role="dialog"]')) return
    if (e.key === 'Escape') {
      e.preventDefault()
      e.stopPropagation()
      return this.close()
    }
    if (!t.closest('[data-day]')) return
    const c = this.cursor.peek()
    const bounds = this.#bounds()
    const week = startOfWeek(c, getWeekStart(currentLocale()))
    const moves: Record<string, () => Date | null> = {
      ArrowRight: () => moveByDays(c, 1, bounds),
      ArrowLeft: () => moveByDays(c, -1, bounds),
      ArrowDown: () => moveByDays(c, 7, bounds),
      ArrowUp: () => moveByDays(c, -7, bounds),
      Home: () => week,
      End: () => addDays(week, 6),
      PageUp: () => moveByMonths(c, e.shiftKey ? -12 : -1, bounds),
      PageDown: () => moveByMonths(c, e.shiftKey ? 12 : 1, bounds),
    }
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      return this.#pick(toISO(c))
    }
    const next = moves[e.key]?.()
    if (next === undefined) return
    e.preventDefault()
    if (next && !outOfRange(next, bounds.min, bounds.max)) {
      this.#focusGrid = true
      this.cursor.value = next
    }
  }

  protected render(): void {
    const input = this.#input()
    const button = this.$('.cv-date-picker-openButton')
    const popup = this.$('[role="dialog"]')
    if (!input || !popup) return
    const open = this.isOpen
    const locale = currentLocale()
    const iso = this.current.value
    const selected = iso ? fromISO(iso) : null
    const popupId = popup.id || `${this.uid}-dialog`
    const text = this.draft.value ?? (selected ? formatDate(selected, locale) : '')

    set(popup, 'id', popupId)
    set(popup, 'data-state', open ? 'open' : 'closed')
    set(popup, 'aria-label', this.$('label')?.textContent?.trim() || t(msg.placeholder))
    set(button, 'aria-label', t(msg.open))
    this.renderField(input, popupId, text, t(msg.placeholder), t(elements.valueMissing), button)
    if (open) this.#renderCalendar(popup, locale, selected)
  }

  #renderCalendar(popup: HTMLElement, locale: string, selected: Date | null): void {
    // The skeleton is built once (again after a morph empties the popup); only the grid is
    // rebuilt per view, so the nav buttons, and focus on them, survive a month change.
    let grid = popup.querySelector('table')
    if (!grid) {
      const nav = (delta: number, glyph: string) =>
        `<button type="button" class="cv-calendar-navButton" data-nav="${delta}"><span aria-hidden="true">${glyph}</span></button>`
      popup.innerHTML = `<div class="cv-calendar-calendar"><div class="cv-calendar-header">${nav(-1, '‹')}<span class="cv-calendar-monthLabel"></span>${nav(1, '›')}</div><table role="grid" class="cv-calendar-grid"></table></div><span class="cv-calendar-srOnly" role="status" aria-live="polite"></span>`
      grid = popup.querySelector('table')!
    }
    const c = this.cursor.value
    const { min, max } = this.#bounds()
    const y = c.getUTCFullYear()
    const m = c.getUTCMonth()
    const cursor = toISO(c)
    const fmt = (o: Intl.DateTimeFormatOptions) =>
      new Intl.DateTimeFormat(locale, { ...o, timeZone: 'UTC' })
    const month = fmt({ month: 'long', year: 'numeric' }).format(c)
    for (const el of popup.querySelectorAll('.cv-calendar-monthLabel, [role="status"]'))
      if (el.textContent !== month) el.textContent = month
    set(grid, 'aria-label', month)
    const navs = popup.querySelectorAll('[data-nav]')
    navs.forEach((b, i) => {
      // Set through the DOM, not a template: translator-supplied text needs no escaping.
      set(b, 'aria-label', t(i ? calMsg.nextMonth : calMsg.previousMonth))
      set(b, 'disabled', viewStepBlocked(y, m, i ? 1 : -1, min, max) ? '' : null)
    })
    // A nav button that just became disabled drops focus; keep it in the dialog.
    if (document.activeElement?.matches('[data-nav]:disabled')) this.#focusGrid = true
    const key = [cursor, selected?.getTime(), locale, min?.getTime(), max?.getTime()].join()
    if (grid.dataset['key'] !== key) {
      const today = toISO(localToday())
      const weekStart = getWeekStart(locale)
      const sel = selected && toISO(selected)
      const wd = fmt({ weekday: 'short' })
      const long = fmt({ dateStyle: 'full' })
      const head = Array.from({ length: 7 }, (_, i) => {
        const name = wd.format(new Date(Date.UTC(2024, 0, 7 + weekStart + i)))
        return `<th class="cv-calendar-weekday" abbr="${name}" scope="col">${name}</th>`
      }).join('')
      const rows = getMonthGrid(y, m, weekStart)
        .map((week) => {
          const cells = week.map((day) => {
            if (!day) return '<td role="gridcell" class="cv-calendar-empty"></td>'
            const d = toISO(day)
            const attrs = [
              `tabindex="${d === cursor ? 0 : -1}"`,
              d === sel ? 'aria-selected="true" data-selected' : '',
              d === today ? 'aria-current="date" data-today' : '',
              outOfRange(day, min, max) ? 'aria-disabled="true"' : '',
            ].join(' ')
            return `<td role="presentation" class="cv-calendar-cell"><button type="button" role="gridcell" class="cv-calendar-day" data-day="${d}" aria-label="${long.format(day)}" ${attrs}>${day.getUTCDate()}</button></td>`
          })
          return `<tr role="row">${cells.join('')}</tr>`
        })
        .join('')
      grid.innerHTML = `<thead><tr role="row">${head}</tr></thead><tbody>${rows}</tbody>`
      grid.dataset['key'] = key
    }
    if (this.#focusGrid) {
      this.#focusGrid = false
      // A popup that has just opened is still `visibility: hidden` until its fade-in starts,
      // so focus() is ignored; retry each frame until focus is somewhere in the dialog.
      const focusDay = () => {
        grid.querySelector<HTMLElement>('[tabindex="0"]')?.focus()
        if (this.isOpen && !popup.contains(document.activeElement)) requestAnimationFrame(focusDay)
      }
      focusDay()
    }
  }
}

export function define(): void {
  defineTag('cv-date-picker', CvDatePicker)
}
