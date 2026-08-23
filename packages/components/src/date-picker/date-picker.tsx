'use client'
import {
  batch,
  cn,
  createMachine,
  useControllableSignal,
  useMachine,
  useSignal,
  useSignalEffect,
  useSignals,
} from '@cascivo/core'
import { builtin, currentLocale, t } from '@cascivo/i18n'
import { useId, useRef } from 'react'
import type { KeyboardEvent } from 'react'
import styles from './date-picker.module.css'

const machine = createMachine({
  initial: 'closed' as const,
  states: {
    closed: { on: { OPEN: 'open' } },
    open: { on: { CLOSE: 'closed' } },
  },
})

function getWeekStart(locale: string): number {
  try {
    const info = (new Intl.Locale(locale) as Intl.Locale & { weekInfo?: { firstDay: number } })
      .weekInfo
    if (info) return info.firstDay % 7
  } catch {}
  return 1 // Monday fallback
}

function getMonthGrid(year: number, month: number, weekStart: number): (Date | null)[][] {
  const first = new Date(Date.UTC(year, month, 1))
  const last = new Date(Date.UTC(year, month + 1, 0))
  const startDow = first.getUTCDay()
  const offset = (startDow - weekStart + 7) % 7
  const days: (Date | null)[] = []
  for (let i = 0; i < offset; i++) days.push(null)
  for (let d = 1; d <= last.getUTCDate(); d++) days.push(new Date(Date.UTC(year, month, d)))
  while (days.length % 7 !== 0) days.push(null)
  const rows: (Date | null)[][] = []
  for (let i = 0; i < days.length; i += 7) rows.push(days.slice(i, i + 7))
  return rows
}

function formatDate(date: Date, locale: string): string {
  return new Intl.DateTimeFormat(locale).format(date)
}

function toISO(date: Date): string {
  return date.toISOString().slice(0, 10)
}

function fromISO(iso: string): Date {
  const [y, m, d] = iso.split('-').map(Number) as [number, number, number]
  return new Date(Date.UTC(y, m - 1, d))
}

export interface DatePickerLabels {
  placeholder?: string
  previousMonth?: string
  nextMonth?: string
  clear?: string
}

/** Join own + inherited `aria-describedby` ids; `undefined` when there are none. */
function mergeDescribedBy(...ids: (string | undefined)[]): string | undefined {
  return ids.filter(Boolean).join(' ') || undefined
}

export interface DatePickerProps {
  /**
   * Wired automatically by a wrapping `Field` — its label id. Forwarded to the focusable
   * control so the Field's label names it.
   */
  'aria-labelledby'?: string
  /**
   * Wired automatically by a wrapping `Field` — the ids of its hint/error text. **Merged**
   * with this component's own `hint`/`error` ids rather than replacing them, so both are
   * announced.
   */
  'aria-describedby'?: string
  /** Wired automatically by a wrapping `Field` when it is in an error state. */
  'aria-invalid'?: boolean
  value?: string
  defaultValue?: string
  /** Called with the selected ISO date string (or undefined when cleared). */
  onValueChange?: (value: string | undefined) => void
  /** @deprecated Use `onValueChange` — it receives the same ISO `string | undefined`. */
  onChange?: (value: string | undefined) => void
  min?: string
  max?: string
  /**
   * Shows a clear button
   *
   * @defaultValue `false`
   * @see the component manifest
   */
  clearable?: boolean
  label?: string
  /**
   * Invisible accessible name, for when a visible element outside this component already
   * labels it and `label` would render that text a second time.
   *
   * `label` on this component is **visible**. `IconButton.label` and `Sparkline.label` are
   * invisible names, so an adopter arriving with that prior writes `label` here and gets the
   * text twice (2026-08-22 report item 13). Both props are listed side by side, each saying
   * which it is.
   */
  ariaLabel?: string
  hint?: string
  error?: string
  /**
   * Field size
   *
   * @defaultValue `md`
   * @see the component manifest
   */
  size?: 'sm' | 'md' | 'lg'
  /**
   * Disables the picker
   *
   * @defaultValue `false`
   * @see the component manifest
   */
  disabled?: boolean
  labels?: DatePickerLabels
  className?: string
  id?: string
}

export function DatePicker({
  value,
  defaultValue,
  onValueChange,
  onChange,
  min,
  max,
  clearable = false,
  label,
  ariaLabel,
  hint,
  error,
  size = 'md',
  disabled = false,
  labels,
  className,
  id,
  'aria-labelledby': ariaLabelledBy,
  'aria-describedby': ariaDescribedBy,
  'aria-invalid': ariaInvalid,
}: DatePickerProps) {
  useSignals()
  const [state, send] = useMachine(machine)
  const baseId = useId()
  const inputId = id ?? `cascade-date-picker-${baseId}`
  const gridId = `${baseId}-grid`
  const locale = currentLocale()

  const resolvedPlaceholder = labels?.placeholder ?? t(builtin.datePicker.placeholder)
  const resolvedPrev = labels?.previousMonth ?? t(builtin.datePicker.previousMonth)
  const resolvedNext = labels?.nextMonth ?? t(builtin.datePicker.nextMonth)
  const resolvedClear = labels?.clear ?? t(builtin.datePicker.clear)

  const today = new Date()
  const todayISO = toISO(today)

  // Controlled mirror goes through the shared primitive: a bare `sig.value = prop` in render
  // notifies the previous render's subscriptions, which React 19 reports as a setState during
  // render (2026-08-08 report A). The primitive skips the write when the value is unchanged.
  const [selectedISO] = useControllableSignal<string | undefined>({
    value,
    defaultValue,
  })

  const viewYear = useSignal(
    selectedISO.value ? fromISO(selectedISO.value).getUTCFullYear() : today.getUTCFullYear(),
  )
  const viewMonth = useSignal(
    selectedISO.value ? fromISO(selectedISO.value).getUTCMonth() : today.getUTCMonth(),
  )
  const activeISO = useSignal<string | undefined>(selectedISO.value)

  const rootRef = useRef<HTMLDivElement>(null)

  // Close on outside click
  useSignalEffect(() => {
    if (state.value !== 'open') return
    const handler = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) send('CLOSE')
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  })

  const open = () => {
    if (disabled) return
    send('OPEN')
  }

  const close = () => send('CLOSE')

  const emitValue = onValueChange ?? onChange

  const select = (iso: string) => {
    if (min && iso < min) return
    if (max && iso > max) return
    if (value === undefined) selectedISO.value = iso
    emitValue?.(iso)
    close()
  }

  const clear = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (value === undefined) selectedISO.value = undefined
    emitValue?.(undefined)
  }

  const prevMonth = () => {
    if (viewMonth.value === 0) {
      batch(() => {
        viewYear.value--
        viewMonth.value = 11
      })
    } else viewMonth.value--
  }

  const nextMonth = () => {
    if (viewMonth.value === 11) {
      batch(() => {
        viewYear.value++
        viewMonth.value = 0
      })
    } else viewMonth.value++
  }

  const weekStart = getWeekStart(locale)
  const grid = getMonthGrid(viewYear.value, viewMonth.value, weekStart)

  // Weekday header labels
  const weekdayFmt = new Intl.DateTimeFormat(locale, { weekday: 'short' })
  const weekdays = Array.from({ length: 7 }, (_, i) => {
    const day = new Date(Date.UTC(2024, 0, 7 + weekStart + i)) // Sunday Jan 7 2024 = DOW 0
    return weekdayFmt.format(day)
  })

  // Month/year header
  const monthFmt = new Intl.DateTimeFormat(locale, { month: 'long', year: 'numeric' })
  const monthLabel = monthFmt.format(new Date(Date.UTC(viewYear.value, viewMonth.value, 1)))

  const handleGridKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    const current = activeISO.value
    if (!current) return
    const d = fromISO(current)
    let next: Date | undefined
    if (e.key === 'ArrowRight')
      next = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate() + 1))
    else if (e.key === 'ArrowLeft')
      next = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate() - 1))
    else if (e.key === 'ArrowDown')
      next = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate() + 7))
    else if (e.key === 'ArrowUp')
      next = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate() - 7))
    else if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      select(current)
      return
    } else if (e.key === 'Escape') {
      close()
      return
    } else return
    e.preventDefault()
    if (next) {
      const nextISO = toISO(next)
      if (min && nextISO < min) return
      if (max && nextISO > max) return
      activeISO.value = nextISO
      batch(() => {
        viewYear.value = next!.getUTCFullYear()
        viewMonth.value = next!.getUTCMonth()
      })
    }
  }

  const displayValue = selectedISO.value ? formatDate(fromISO(selectedISO.value), locale) : ''

  return (
    <div
      ref={rootRef}
      className={cn(styles['wrapper'], className)}
      data-state={error ? 'error' : state.value}
      data-size={size}
    >
      {label && (
        <label className={styles['label']} htmlFor={inputId}>
          {label}
        </label>
      )}
      <div className={styles['field']}>
        <button
          id={inputId}
          type="button"
          role="combobox"
          aria-expanded={state.value === 'open'}
          aria-controls={gridId}
          aria-haspopup="dialog"
          aria-labelledby={ariaLabelledBy}
          aria-label={ariaLabel}
          aria-invalid={error ? true : ariaInvalid}
          aria-describedby={mergeDescribedBy(
            error ? `${baseId}-error` : hint ? `${baseId}-hint` : undefined,
            ariaDescribedBy,
          )}
          className={styles['trigger']}
          disabled={disabled}
          onClick={state.value === 'open' ? close : open}
        >
          <span className={cn(styles['value'], !displayValue ? styles['placeholder'] : undefined)}>
            {displayValue || resolvedPlaceholder}
          </span>
          <span className={styles['icon']} aria-hidden="true">
            📅
          </span>
        </button>
        {clearable && selectedISO.value !== undefined && (
          <button
            type="button"
            className={styles['clear']}
            aria-label={resolvedClear}
            onClick={clear}
          >
            ✕
          </button>
        )}
      </div>
      <div
        id={gridId}
        role="dialog"
        aria-label={monthLabel}
        className={styles['calendar']}
        data-state={state.value}
        onKeyDown={handleGridKeyDown}
      >
        <div className={styles['header']}>
          <button
            type="button"
            className={styles['navButton']}
            aria-label={resolvedPrev}
            onClick={prevMonth}
          >
            ‹
          </button>
          <span className={styles['monthLabel']} aria-live="polite">
            {monthLabel}
          </span>
          <button
            type="button"
            className={styles['navButton']}
            aria-label={resolvedNext}
            onClick={nextMonth}
          >
            ›
          </button>
        </div>
        <table role="grid" className={styles['grid']}>
          <thead>
            <tr>
              {weekdays.map((wd) => (
                <th key={wd} className={styles['weekday']} abbr={wd} scope="col">
                  {wd}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {grid.map((week, wi) => (
              <tr key={wi}>
                {week.map((day, di) => {
                  if (!day) return <td key={di} className={styles['empty']} />
                  const iso = toISO(day)
                  const isSelected = iso === selectedISO.value
                  const isToday = iso === todayISO
                  const isActive = iso === activeISO.value
                  const isDisabled =
                    (min !== undefined && iso < min) || (max !== undefined && iso > max)
                  return (
                    <td key={di} className={styles['cell']}>
                      <button
                        type="button"
                        className={styles['day']}
                        tabIndex={isActive ? 0 : -1}
                        aria-pressed={isSelected}
                        aria-label={formatDate(day, locale)}
                        aria-current={isToday ? 'date' : undefined}
                        aria-disabled={isDisabled || undefined}
                        data-selected={isSelected || undefined}
                        data-today={isToday || undefined}
                        onClick={() => {
                          if (!isDisabled) select(iso)
                        }}
                        onFocus={() => {
                          activeISO.value = iso
                        }}
                      >
                        {day.getUTCDate()}
                      </button>
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {error && (
        <span id={`${baseId}-error`} className={styles['error']} role="alert">
          {error}
        </span>
      )}
      {!error && hint && (
        <span id={`${baseId}-hint`} className={styles['hint']}>
          {hint}
        </span>
      )}
    </div>
  )
}
