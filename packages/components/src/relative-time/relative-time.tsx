'use client'
import { cn, useSignal, useSignalEffect, useSignals } from '@cascivo/core'
import { formatDate, formatRelativeTime } from '@cascivo/i18n'
import type { TimeHTMLAttributes } from 'react'
import styles from './relative-time.module.css'

export interface RelativeTimeProps extends Omit<TimeHTMLAttributes<HTMLTimeElement>, 'dateTime'> {
  /** The instant to describe relative to now. */
  date: Date | number | string
  /** Auto-update as time passes. Default true. */
  sync?: boolean
  /** Override "now" (ms since epoch). Mainly for deterministic tests; disables the interval. */
  now?: number
  /** Passed through to Intl.RelativeTimeFormat (e.g. `{ numeric: 'auto' }`). */
  format?: Intl.RelativeTimeFormatOptions
}

const SECOND = 1000
const MINUTE = 60 * SECOND
const HOUR = 60 * MINUTE
const DAY = 24 * HOUR
const WEEK = 7 * DAY
const MONTH = 30 * DAY
const YEAR = 365 * DAY

interface Selected {
  value: number
  unit: Intl.RelativeTimeFormatUnit
  nextUpdateMs: number
}

function selectUnit(deltaMs: number): Selected {
  const abs = Math.abs(deltaMs)
  if (abs < MINUTE)
    return { value: Math.round(deltaMs / SECOND), unit: 'second', nextUpdateMs: SECOND }
  if (abs < HOUR)
    return { value: Math.round(deltaMs / MINUTE), unit: 'minute', nextUpdateMs: MINUTE }
  if (abs < DAY) return { value: Math.round(deltaMs / HOUR), unit: 'hour', nextUpdateMs: HOUR }
  if (abs < WEEK) return { value: Math.round(deltaMs / DAY), unit: 'day', nextUpdateMs: DAY }
  if (abs < MONTH) return { value: Math.round(deltaMs / WEEK), unit: 'week', nextUpdateMs: DAY }
  if (abs < YEAR) return { value: Math.round(deltaMs / MONTH), unit: 'month', nextUpdateMs: DAY }
  return { value: Math.round(deltaMs / YEAR), unit: 'year', nextUpdateMs: DAY }
}

const toTimestamp = (date: Date | number | string): number =>
  date instanceof Date ? date.getTime() : typeof date === 'number' ? date : Date.parse(date)

export function RelativeTime({
  date,
  sync = true,
  now: nowProp,
  format,
  className,
  ...props
}: RelativeTimeProps) {
  useSignals()
  const target = toTimestamp(date)
  const isControlled = nowProp !== undefined
  const now = useSignal(nowProp ?? Date.now())
  if (isControlled) now.value = nowProp as number

  // Tick on an interval whose cadence scales with the magnitude. Reading
  // `now.value` re-subscribes the effect so the cadence adapts as time grows.
  // SSR/no-DOM safe; skipped when controlled (tests drive `now`) or sync is off.
  useSignalEffect(() => {
    if (!sync || isControlled || typeof window === 'undefined') return
    const { nextUpdateMs } = selectUnit(target - now.value)
    const id = window.setInterval(() => {
      now.value = Date.now()
    }, nextUpdateMs)
    return () => window.clearInterval(id)
  })

  const { value, unit } = selectUnit(target - now.value)
  const text = formatRelativeTime(value, unit, format)
  const iso = new Date(target).toISOString()
  const absolute = formatDate(target, { dateStyle: 'long', timeStyle: 'short' })

  return (
    <time
      dateTime={iso}
      title={absolute}
      className={cn(styles['relativeTime'], className)}
      {...props}
    >
      {text}
    </time>
  )
}
