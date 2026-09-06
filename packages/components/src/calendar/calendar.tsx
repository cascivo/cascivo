'use client'
import { batch, cn, focusElement, useSignal, useSignalEffect, useSignals } from '@cascivo/core'
import { builtin, currentLocale, t } from '@cascivo/i18n'
import { useRef } from 'react'
import type { KeyboardEvent } from 'react'
import {
  addDays,
  dayKey,
  getMonthGrid,
  getWeekStart,
  isoWeek,
  localToday,
  moveByDays,
  moveByMonths,
  outOfRange,
  sameDay,
  startOfWeek,
  viewStepBlocked,
} from './calendar-date'
import styles from './calendar.module.css'

export interface CalendarLabels {
  previousMonth?: string
  nextMonth?: string
  today?: string
  weekNumber?: string
}

export interface CalendarProps {
  value?: Date | null
  defaultValue?: Date
  onValueChange?: (date: Date) => void
  min?: Date
  max?: Date
  disabled?: (date: Date) => boolean
  locale?: string
  /**
   * Grid cell size
   *
   * @defaultValue `md`
   * @see the component manifest
   */
  size?: 'sm' | 'md' | 'lg'
  labels?: CalendarLabels
  className?: string
  /**
   * Accessible name for the grid. Defaults to the visible month label.
   *
   * Calendar has no visible label slot — the month heading is its own — so `label` and
   * `ariaLabel` are aliases for the same invisible name. `ariaLabel` wins if both are given.
   */
  ariaLabel?: string
  /** Alias for `ariaLabel`. See the note there. */
  label?: string
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
  /**
   * Hides the prev/next nav so a parent can drive navigation
   *
   * @defaultValue `false`
   * @see the component manifest
   */
  hideNav?: boolean
  /**
   * When true, shows a button that jumps the view to the current month and focuses today.
   *
   * @defaultValue `false`
   * @see the component manifest
   */
  showToday?: boolean
  /**
   * When true, prefixes each row with its ISO-8601 week number.
   *
   * @defaultValue `false`
   * @see the component manifest
   */
  showWeekNumbers?: boolean
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
  ariaLabel,
  label,
  isInRange,
  isRangeStart,
  isRangeEnd,
  onDayHover,
  month,
  year,
  onViewChange,
  hideNav = false,
  showToday = false,
  showWeekNumbers = false,
}: CalendarProps) {
  useSignals()
  const locale = localeProp ?? currentLocale()
  const gridRef = useRef<HTMLTableElement>(null)

  const resolvedPrev = labels?.previousMonth ?? t(builtin.calendar.previousMonth)
  const resolvedNext = labels?.nextMonth ?? t(builtin.calendar.nextMonth)
  const resolvedToday = labels?.today ?? t(builtin.calendar.today)
  const resolvedWeek = labels?.weekNumber ?? t(builtin.calendar.weekNumber)

  const selected = value !== undefined ? value : (defaultValue ?? null)
  const today = localToday()
  const initial = selected ?? defaultValue ?? today

  const viewYear = useSignal(initial.getUTCFullYear())
  const viewMonth = useSignal(initial.getUTCMonth())
  const focusedDate = useSignal<Date>(initial)
  // Set when the keyboard or a nav button moves the cursor, so the effect below knows to take
  // DOM focus with it. A render caused by anything else must not steal focus.
  const pendingFocus = useSignal<string | null>(null)

  const isViewControlled = month !== undefined || year !== undefined
  if (year !== undefined && viewYear.peek() !== year) viewYear.value = year
  if (month !== undefined && viewMonth.peek() !== month) viewMonth.value = month

  /**
   * Follow a changed controlled `value` into view. `useControllableSignal`'s `defaultValue`
   * only reads at mount, so `<Calendar value={july15} />` after rendering June used to stay
   * on June with the selection off-screen.
   */
  const lastSelectedKey = useRef<string | null>(selected ? dayKey(selected) : null)
  const selectedKey = selected ? dayKey(selected) : null
  if (selectedKey !== lastSelectedKey.current) {
    lastSelectedKey.current = selectedKey
    if (selected && !isViewControlled) {
      batch(() => {
        viewYear.value = selected.getUTCFullYear()
        viewMonth.value = selected.getUTCMonth()
        focusedDate.value = selected
      })
    }
  }

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

  const bounds = { min, max, isDisabled: disabled }

  /**
   * Move the cursor and take DOM focus with it. Setting `tabIndex` alone was the whole of the
   * old implementation: the roving index moved but real focus stayed on the previous button,
   * and once an arrow crossed a month boundary that button unmounted and focus fell to
   * `<body>` — the user was ejected from the widget mid-navigation.
   */
  const moveCursor = (next: Date): void => {
    const changedMonth =
      next.getUTCMonth() !== viewMonth.peek() || next.getUTCFullYear() !== viewYear.peek()
    if (!isViewControlled) {
      batch(() => {
        viewYear.value = next.getUTCFullYear()
        viewMonth.value = next.getUTCMonth()
        focusedDate.value = next
      })
    } else {
      focusedDate.value = next
    }
    pendingFocus.value = dayKey(next)
    if (changedMonth) onViewChange?.({ month: next.getUTCMonth(), year: next.getUTCFullYear() })
  }

  /**
   * Deferred by a task, not run inline: Preact signal effects fire synchronously on write, so
   * reading the DOM here during the write would find the *previous* month still rendered.
   * React also reuses the day buttons positionally across months, so doing nothing is not
   * neutral — focus stays on the reused node and silently lands on whatever date now occupies
   * that grid slot (paging from 18 March put focus on 22 April, the same cell index).
   */
  useSignalEffect(() => {
    const key = pendingFocus.value
    if (!key) return
    const timer = setTimeout(() => {
      pendingFocus.value = null
      focusElement(gridRef.current?.querySelector<HTMLElement>(`[data-day="${key}"]`) ?? null)
    }, 0)
    return () => clearTimeout(timer)
  })

  const select = (date: Date): void => {
    if (isDayDisabled(date)) return
    // Keep the cursor with the selection, so a click followed by an arrow continues from
    // where the user clicked rather than from wherever the roving index had been left.
    focusedDate.value = date
    onValueChange?.(date)
  }

  const stepView = (delta: number): void => {
    const y = viewYear.peek()
    const m = viewMonth.peek()
    if (viewStepBlocked(y, m, delta, min, max)) return
    const nextMonthIdx = (((m + delta) % 12) + 12) % 12
    const nextYear = y + Math.floor((m + delta) / 12)
    if (!isViewControlled) {
      batch(() => {
        viewMonth.value = nextMonthIdx
        viewYear.value = nextYear
      })
    }
    onViewChange?.({ month: nextMonthIdx, year: nextYear })
  }

  const goToToday = (): void => {
    if (isDayDisabled(today)) return
    moveCursor(today)
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLTableElement>): void => {
    const current = focusedDate.value
    let next: Date | null | undefined
    switch (e.key) {
      case 'ArrowRight':
        next = moveByDays(current, 1, bounds)
        break
      case 'ArrowLeft':
        next = moveByDays(current, -1, bounds)
        break
      case 'ArrowDown':
        next = moveByDays(current, 7, bounds)
        break
      case 'ArrowUp':
        next = moveByDays(current, -7, bounds)
        break
      case 'Home': {
        const start = startOfWeek(current, weekStart)
        next = isDayDisabled(start) ? moveByDays(start, 1, bounds) : start
        break
      }
      case 'End': {
        const end = addDays(startOfWeek(current, weekStart), 6)
        next = isDayDisabled(end) ? moveByDays(end, -1, bounds) : end
        break
      }
      case 'PageUp':
        next = moveByMonths(current, e.shiftKey ? -12 : -1, bounds)
        break
      case 'PageDown':
        next = moveByMonths(current, e.shiftKey ? 12 : 1, bounds)
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
    // `null` means the move would leave the allowed range; stay put rather than navigating
    // into a month where every day is disabled.
    if (!next) return
    moveCursor(next)
    onDayHover?.(next)
  }

  const prevBlocked = viewStepBlocked(viewYear.value, viewMonth.value, -1, min, max)
  const nextBlocked = viewStepBlocked(viewYear.value, viewMonth.value, 1, min, max)

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
            disabled={prevBlocked}
            onClick={() => stepView(-1)}
          >
            <span aria-hidden="true">‹</span>
          </button>
        ) : (
          <span className={styles['navSpacer']} />
        )}
        {/* Not a live region: this text is also the grid's accessible name, so announcing it
            here would mutate the name of the container focus sits inside. The month change is
            announced by the separate status region below. */}
        <span className={styles['monthLabel']}>{monthLabel}</span>
        {!hideNav ? (
          <button
            type="button"
            className={styles['navButton']}
            aria-label={resolvedNext}
            disabled={nextBlocked}
            onClick={() => stepView(1)}
          >
            <span aria-hidden="true">›</span>
          </button>
        ) : (
          <span className={styles['navSpacer']} />
        )}
      </div>

      <table
        ref={gridRef}
        role="grid"
        aria-label={ariaLabel ?? label ?? monthLabel}
        className={styles['grid']}
        onKeyDown={handleKeyDown}
      >
        <thead>
          <tr role="row">
            {showWeekNumbers && (
              <th className={styles['weekday']} scope="col">
                <span className={styles['srOnly']}>{resolvedWeek}</span>
              </th>
            )}
            {weekdays.map((wd) => (
              <th key={wd} className={styles['weekday']} abbr={wd} scope="col">
                {wd}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {grid.map((week, wi) => {
            const firstDay = week.find(Boolean)
            return (
              <tr role="row" key={wi}>
                {showWeekNumbers && (
                  <th scope="row" className={styles['weekNumber']}>
                    {firstDay ? isoWeek(firstDay) : ''}
                  </th>
                )}
                {week.map((day, di) => {
                  if (!day) return <td key={di} role="gridcell" className={styles['empty']} />
                  const isSelected = sameDay(day, selected)
                  const isToday = sameDay(day, today)
                  const isFocused = sameDay(day, focusedDate.value)
                  const dayDisabled = isDayDisabled(day)
                  return (
                    <td key={di} role="gridcell" className={styles['cell']}>
                      <button
                        type="button"
                        className={styles['day']}
                        data-day={dayKey(day)}
                        tabIndex={isFocused ? 0 : -1}
                        aria-label={dayLabelFmt.format(day)}
                        // On the button, not the <td>: focus lands here, so this is the
                        // element whose selected state assistive technology reads. Omitted
                        // rather than "false" so 30 cells do not each announce a negative.
                        aria-selected={isSelected || undefined}
                        aria-current={isToday ? 'date' : undefined}
                        aria-disabled={dayDisabled || undefined}
                        data-selected={isSelected || undefined}
                        data-today={isToday || undefined}
                        data-in-range={(isInRange?.(day) ?? false) || undefined}
                        data-range-start={(isRangeStart?.(day) ?? false) || undefined}
                        data-range-end={(isRangeEnd?.(day) ?? false) || undefined}
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
            )
          })}
        </tbody>
      </table>

      {showToday && (
        <div className={styles['footer']}>
          <button
            type="button"
            className={styles['todayButton']}
            disabled={isDayDisabled(today)}
            onClick={goToToday}
          >
            {resolvedToday}
          </button>
        </div>
      )}

      {/* A separate announcer, mounted up front, so paging the month is spoken without
          rewriting the grid's own accessible name. */}
      <span className={styles['srOnly']} role="status" aria-live="polite">
        {monthLabel}
      </span>
    </div>
  )
}
