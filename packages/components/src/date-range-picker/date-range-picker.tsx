'use client'
import {
  batch,
  cn,
  useControllableSignal,
  useSignal,
  useSignalEffect,
  useSignals,
} from '@cascivo/core'
import { builtin, currentLocale, t } from '@cascivo/i18n'
import { useRef } from 'react'
import { Calendar, type CalendarProps } from '../calendar/calendar'
import styles from './date-range-picker.module.css'

export interface DateRange {
  start: Date
  end: Date
}

export interface DateRangePreset {
  label: string
  range: DateRange
}

export interface DateRangePickerLabels {
  placeholder?: string
  start?: string
  end?: string
  apply?: string
  clear?: string
  previousMonth?: string
  nextMonth?: string
}

export interface DateRangePickerProps {
  value?: DateRange | null
  defaultValue?: DateRange
  onValueChange?: (range: DateRange) => void
  min?: Date
  max?: Date
  disabled?: (date: Date) => boolean
  presets?: DateRangePreset[]
  locale?: string
  placeholder?: string
  size?: 'sm' | 'md' | 'lg'
  labels?: DateRangePickerLabels
  className?: string
}

function dayMs(date: Date): number {
  return Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate())
}

function sameDay(a: Date | null | undefined, b: Date | null | undefined): boolean {
  if (!a || !b) return false
  return dayMs(a) === dayMs(b)
}

function addMonths(year: number, month: number, delta: number): { year: number; month: number } {
  const d = new Date(Date.UTC(year, month + delta, 1))
  return { year: d.getUTCFullYear(), month: d.getUTCMonth() }
}

export function DateRangePicker({
  value,
  defaultValue,
  onValueChange,
  min,
  max,
  disabled,
  presets,
  locale: localeProp,
  placeholder,
  size = 'md',
  labels,
  className,
}: DateRangePickerProps) {
  useSignals()
  const locale = localeProp ?? currentLocale()

  const resolvedPlaceholder = placeholder ?? t(builtin.dateRangePicker.placeholder)
  const resolvedApply = labels?.apply ?? t(builtin.dateRangePicker.apply)
  const resolvedClear = labels?.clear ?? t(builtin.dateRangePicker.clear)
  const resolvedPrev = labels?.previousMonth ?? t(builtin.calendar.previousMonth)
  const resolvedNext = labels?.nextMonth ?? t(builtin.calendar.nextMonth)

  const [range, setRange] = useControllableSignal<DateRange | null>({
    value: value === undefined ? undefined : value,
    defaultValue: defaultValue ?? null,
    onChange: (r) => {
      if (r) onValueChange?.(r)
    },
  })

  const open = useSignal(false)
  const pendingStart = useSignal<Date | null>(null)
  const hoverDate = useSignal<Date | null>(null)

  // Left calendar view; right is always +1 month.
  const seed = range.value?.start ?? defaultValue?.start ?? new Date()
  const viewYear = useSignal(seed.getUTCFullYear())
  const viewMonth = useSignal(seed.getUTCMonth())

  const rootRef = useRef<HTMLDivElement>(null)

  // Close on outside click.
  useSignalEffect(() => {
    if (!open.value) return
    const handler = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) open.value = false
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  })

  const openPanel = () => {
    open.value = true
  }
  const closePanel = () => {
    open.value = false
  }

  const advance = (delta: number) => {
    const next = addMonths(viewYear.value, viewMonth.value, delta)
    batch(() => {
      viewYear.value = next.year
      viewMonth.value = next.month
    })
  }

  const handleDayClick = (date: Date) => {
    const pending = pendingStart.value
    if (pending === null) {
      // First click: set pending start.
      pendingStart.value = date
      return
    }
    // Second click.
    if (sameDay(pending, date)) {
      // Same date twice → clear.
      batch(() => {
        pendingStart.value = null
        hoverDate.value = null
      })
      setRange(null)
      return
    }
    // Emit sorted range.
    const sorted =
      dayMs(pending) <= dayMs(date) ? { start: pending, end: date } : { start: date, end: pending }
    batch(() => {
      pendingStart.value = null
      hoverDate.value = null
    })
    setRange(sorted)
  }

  const applyPreset = (preset: DateRangePreset) => {
    batch(() => {
      pendingStart.value = null
      hoverDate.value = null
      viewYear.value = preset.range.start.getUTCFullYear()
      viewMonth.value = preset.range.start.getUTCMonth()
    })
    setRange(preset.range)
  }

  const clear = () => {
    batch(() => {
      pendingStart.value = null
      hoverDate.value = null
    })
    setRange(null)
  }

  // Range/preview boundaries — uses pending+hover while selecting, else the committed range.
  const activeStart = pendingStart.value ?? range.value?.start ?? null
  const activeEnd = pendingStart.value ? (hoverDate.value ?? null) : (range.value?.end ?? null)

  const lowKey = activeStart && activeEnd ? Math.min(dayMs(activeStart), dayMs(activeEnd)) : null
  const highKey = activeStart && activeEnd ? Math.max(dayMs(activeStart), dayMs(activeEnd)) : null

  const isInRange = (date: Date): boolean => {
    if (lowKey === null || highKey === null) return false
    const k = dayMs(date)
    return k > lowKey && k < highKey
  }
  const isRangeStart = (date: Date): boolean =>
    sameDay(date, activeStart) || (lowKey !== null && dayMs(date) === lowKey)
  const isRangeEnd = (date: Date): boolean =>
    sameDay(date, activeEnd) || (highKey !== null && dayMs(date) === highKey)

  const fmt = new Intl.DateTimeFormat(locale, { year: 'numeric', month: 'short', day: 'numeric' })
  const displayValue = range.value
    ? `${fmt.format(range.value.start)} → ${fmt.format(range.value.end)}`
    : ''

  const right = addMonths(viewYear.value, viewMonth.value, 1)

  const calendarProps: CalendarProps = {
    locale,
    size,
    ...(min !== undefined ? { min } : {}),
    ...(max !== undefined ? { max } : {}),
    ...(disabled !== undefined ? { disabled } : {}),
    hideNav: true,
    isInRange,
    isRangeStart,
    isRangeEnd,
    onValueChange: handleDayClick,
    onDayHover: (d: Date | null) => {
      hoverDate.value = d
    },
    labels: { previousMonth: resolvedPrev, nextMonth: resolvedNext },
  }

  return (
    <div
      ref={rootRef}
      className={cn(styles['wrapper'], className)}
      data-size={size}
      onKeyDown={(e) => {
        if (e.key === 'Escape' && open.value) {
          e.stopPropagation()
          closePanel()
        }
      }}
    >
      <button
        type="button"
        role="combobox"
        aria-expanded={open.value}
        aria-haspopup="dialog"
        className={styles['trigger']}
        onClick={open.value ? closePanel : openPanel}
      >
        <span className={cn(styles['value'], !displayValue ? styles['placeholder'] : undefined)}>
          {displayValue || resolvedPlaceholder}
        </span>
        <span className={styles['icon']} aria-hidden="true">
          📅
        </span>
      </button>
      <div role="dialog" className={styles['panel']} data-state={open.value ? 'open' : 'closed'}>
        {presets && presets.length > 0 && (
          <div className={styles['presets']}>
            {presets.map((preset) => (
              <button
                key={preset.label}
                type="button"
                className={styles['preset']}
                onClick={() => applyPreset(preset)}
              >
                {preset.label}
              </button>
            ))}
          </div>
        )}
        <div className={styles['calendars']}>
          <div className={styles['calNav']}>
            <button
              type="button"
              className={styles['navButton']}
              aria-label={resolvedPrev}
              onClick={() => advance(-1)}
            >
              ‹
            </button>
          </div>
          <Calendar month={viewMonth.value} year={viewYear.value} {...calendarProps} />
          <Calendar month={right.month} year={right.year} {...calendarProps} />
          <div className={styles['calNav']}>
            <button
              type="button"
              className={styles['navButton']}
              aria-label={resolvedNext}
              onClick={() => advance(1)}
            >
              ›
            </button>
          </div>
        </div>
        <div className={styles['footer']}>
          <button type="button" className={styles['clearBtn']} onClick={clear}>
            {resolvedClear}
          </button>
          <button type="button" className={styles['applyBtn']} onClick={closePanel}>
            {resolvedApply}
          </button>
        </div>
      </div>
    </div>
  )
}
