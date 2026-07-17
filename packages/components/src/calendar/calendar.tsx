'use client'
import { batch, cn, useSignal, useSignals } from '@cascivo/core'
import { builtin, currentLocale, t } from '@cascivo/i18n'
import type { KeyboardEvent } from 'react'
import styles from './calendar.module.css'

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

/** UTC-safe day-key, used for equality comparisons. */
function dayKey(date: Date): string {
  return `${date.getUTCFullYear()}-${date.getUTCMonth()}-${date.getUTCDate()}`
}

function sameDay(a: Date | null | undefined, b: Date | null | undefined): boolean {
  if (!a || !b) return false
  return dayKey(a) === dayKey(b)
}

function addDays(date: Date, days: number): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate() + days))
}

function addMonths(date: Date, months: number): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + months, date.getUTCDate()))
}

function startOfWeek(date: Date, weekStart: number): Date {
  const dow = date.getUTCDay()
  const diff = (dow - weekStart + 7) % 7
  return addDays(date, -diff)
}

/** True when `date` is outside the [min, max] inclusive bounds (compared at day granularity). */
function outOfRange(date: Date, min?: Date, max?: Date): boolean {
  if (min) {
    const minDay = new Date(Date.UTC(min.getUTCFullYear(), min.getUTCMonth(), min.getUTCDate()))
    if (date.getTime() < minDay.getTime()) return true
  }
  if (max) {
    const maxDay = new Date(Date.UTC(max.getUTCFullYear(), max.getUTCMonth(), max.getUTCDate()))
    if (date.getTime() > maxDay.getTime()) return true
  }
  return false
}

export interface CalendarLabels {
  previousMonth?: string
  nextMonth?: string
}

export interface CalendarProps {
  value?: Date | null
  defaultValue?: Date
  onValueChange?: (date: Date) => void
  min?: Date
  max?: Date
  disabled?: (date: Date) => boolean
  locale?: string
  size?: 'sm' | 'md' | 'lg'
  labels?: CalendarLabels
  className?: string
  /** Highlight predicate for range previews (date-range-picker). */
  isInRange?: (date: Date) => boolean
  /** Range endpoint markers for styling. */
  isRangeStart?: (date: Date) => boolean
  isRangeEnd?: (date: Date) => boolean
  /** Hover handler for range preview. */
  onDayHover?: (date: Date | null) => void
  /** Controlled view month (0-11). When set, the calendar's displayed month is owned by the parent. */
  month?: number
  /** Controlled view year. */
  year?: number
  /** Called when the user navigates months (prev/next or keyboard). */
  onViewChange?: (view: { month: number; year: number }) => void
  /** Hide the prev/next header nav (parent drives navigation). */
  hideNav?: boolean
}

export function Calendar({
  value,
  defaultValue,
  onValueChange,
  min,
  max,
  disabled,
  locale: localeProp,
  size = 'md',
  labels,
  className,
  isInRange,
  isRangeStart,
  isRangeEnd,
  onDayHover,
  month,
  year,
  onViewChange,
  hideNav = false,
}: CalendarProps) {
  useSignals()
  const locale = localeProp ?? currentLocale()

  const resolvedPrev = labels?.previousMonth ?? t(builtin.calendar.previousMonth)
  const resolvedNext = labels?.nextMonth ?? t(builtin.calendar.nextMonth)

  const selected = value !== undefined ? value : (defaultValue ?? null)
  const today = new Date()

  const initial = selected ?? defaultValue ?? today
  const viewYear = useSignal(initial.getUTCFullYear())
  const viewMonth = useSignal(initial.getUTCMonth())
  const focusedDate = useSignal<Date>(initial)

  // Controlled view: mirror parent-owned month/year into local signals each render.
  if (month !== undefined) viewMonth.value = month
  if (year !== undefined) viewYear.value = year

  const weekStart = getWeekStart(locale)
  const grid = getMonthGrid(viewYear.value, viewMonth.value, weekStart)

  const weekdayFmt = new Intl.DateTimeFormat(locale, { weekday: 'short' })
  const weekdays = Array.from({ length: 7 }, (_, i) => {
    const day = new Date(Date.UTC(2024, 0, 7 + weekStart + i)) // Sunday Jan 7 2024 = DOW 0
    return weekdayFmt.format(day)
  })

  const dayLabelFmt = new Intl.DateTimeFormat(locale, {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
  const monthFmt = new Intl.DateTimeFormat(locale, { month: 'long', year: 'numeric' })
  const monthLabel = monthFmt.format(new Date(Date.UTC(viewYear.value, viewMonth.value, 1)))

  const isDayDisabled = (date: Date): boolean =>
    outOfRange(date, min, max) || (disabled ? disabled(date) : false)

  const isViewControlled = month !== undefined || year !== undefined

  const setView = (date: Date) => {
    if (!isViewControlled) {
      batch(() => {
        viewYear.value = date.getUTCFullYear()
        viewMonth.value = date.getUTCMonth()
        focusedDate.value = date
      })
    } else {
      focusedDate.value = date
    }
    onViewChange?.({ month: date.getUTCMonth(), year: date.getUTCFullYear() })
  }

  const select = (date: Date) => {
    if (isDayDisabled(date)) return
    onValueChange?.(date)
  }

  const stepMonth = (delta: number) => {
    const base = new Date(Date.UTC(viewYear.value, viewMonth.value, 1))
    const target = addMonths(base, delta)
    const nextMonthIdx = target.getUTCMonth()
    const nextYear = target.getUTCFullYear()
    if (!isViewControlled) {
      batch(() => {
        viewMonth.value = nextMonthIdx
        viewYear.value = nextYear
      })
    }
    onViewChange?.({ month: nextMonthIdx, year: nextYear })
  }

  const prevMonth = () => stepMonth(-1)
  const nextMonth = () => stepMonth(1)

  const handleKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    const current = focusedDate.value
    let next: Date | undefined
    switch (e.key) {
      case 'ArrowRight':
        next = addDays(current, 1)
        break
      case 'ArrowLeft':
        next = addDays(current, -1)
        break
      case 'ArrowDown':
        next = addDays(current, 7)
        break
      case 'ArrowUp':
        next = addDays(current, -7)
        break
      case 'Home':
        next = startOfWeek(current, weekStart)
        break
      case 'End':
        next = addDays(startOfWeek(current, weekStart), 6)
        break
      case 'PageUp':
        next = addMonths(current, e.shiftKey ? -12 : -1)
        break
      case 'PageDown':
        next = addMonths(current, e.shiftKey ? 12 : 1)
        break
      case 'Enter':
      case ' ':
        e.preventDefault()
        select(current)
        return
      default:
        return
    }
    e.preventDefault()
    setView(next)
    onDayHover?.(next)
  }

  return (
    <div
      className={cn(styles['calendar'], className)}
      data-size={size}
      onMouseLeave={() => onDayHover?.(null)}
    >
      <div className={styles['header']}>
        {!hideNav ? (
          <button
            type="button"
            className={styles['navButton']}
            aria-label={resolvedPrev}
            onClick={prevMonth}
          >
            ‹
          </button>
        ) : (
          <span className={styles['navSpacer']} />
        )}
        <span className={styles['monthLabel']} aria-live="polite">
          {monthLabel}
        </span>
        {!hideNav ? (
          <button
            type="button"
            className={styles['navButton']}
            aria-label={resolvedNext}
            onClick={nextMonth}
          >
            ›
          </button>
        ) : (
          <span className={styles['navSpacer']} />
        )}
      </div>
      <table
        role="grid"
        aria-label={monthLabel}
        className={styles['grid']}
        onKeyDown={handleKeyDown}
      >
        <thead>
          <tr role="row">
            {weekdays.map((wd) => (
              <th key={wd} className={styles['weekday']} abbr={wd} scope="col">
                {wd}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {grid.map((week, wi) => (
            <tr role="row" key={wi}>
              {week.map((day, di) => {
                if (!day) return <td key={di} role="gridcell" className={styles['empty']} />
                const isSelected = sameDay(day, selected)
                const isToday = sameDay(day, today)
                const isFocused = sameDay(day, focusedDate.value)
                const dayDisabled = isDayDisabled(day)
                const inRange = isInRange ? isInRange(day) : false
                const rangeStart = isRangeStart ? isRangeStart(day) : false
                const rangeEnd = isRangeEnd ? isRangeEnd(day) : false
                return (
                  <td
                    key={di}
                    role="gridcell"
                    className={styles['cell']}
                    aria-selected={isSelected}
                  >
                    <button
                      type="button"
                      className={styles['day']}
                      tabIndex={isFocused ? 0 : -1}
                      aria-label={dayLabelFmt.format(day)}
                      aria-current={isToday ? 'date' : undefined}
                      aria-disabled={dayDisabled || undefined}
                      data-selected={isSelected || undefined}
                      data-today={isToday || undefined}
                      data-in-range={inRange || undefined}
                      data-range-start={rangeStart || undefined}
                      data-range-end={rangeEnd || undefined}
                      onClick={() => select(day)}
                      onFocus={() => {
                        focusedDate.value = day
                      }}
                      onMouseEnter={() => onDayHover?.(day)}
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
  )
}
