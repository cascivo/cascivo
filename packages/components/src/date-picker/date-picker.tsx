'use client'
import {
  batch,
  cn,
  createMachine,
  useMachine,
  useSignal,
  useSignalEffect,
  useSignals,
} from '@cascivo/core'
import { builtin, currentLocale, t } from '@cascivo/i18n'
import { useId, useRef, type KeyboardEvent } from 'react'
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
  let startDow = first.getUTCDay()
  let offset = (startDow - weekStart + 7) % 7
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

export interface DatePickerProps {
  value?: string
  defaultValue?: string
  onChange?: (value: string | undefined) => void
  min?: string
  max?: string
  clearable?: boolean
  label?: string
  hint?: string
  error?: string
  size?: 'sm' | 'md' | 'lg'
  disabled?: boolean
  labels?: DatePickerLabels
  className?: string
  id?: string
}

export function DatePicker({
  value,
  defaultValue,
  onChange,
  min,
  max,
  clearable = false,
  label,
  hint,
  error,
  size = 'md',
  disabled = false,
  labels,
  className,
  id,
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

  const selectedISO = useSignal<string | undefined>(value ?? defaultValue)
  if (value !== undefined) selectedISO.value = value

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

  const select = (iso: string) => {
    if (min && iso < min) return
    if (max && iso > max) return
    if (value === undefined) selectedISO.value = iso
    onChange?.(iso)
    close()
  }

  const clear = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (value === undefined) selectedISO.value = undefined
    onChange?.(undefined)
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
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? `${baseId}-error` : hint ? `${baseId}-hint` : undefined}
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
