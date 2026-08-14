// Tooltip: KPI displays a single aggregate value — no data-point traversal.
import type { ReactNode } from 'react'
import { currentLocale } from '@cascivo/i18n'
import { sentimentOf } from '@cascivo/core'
import { Sparkline } from '../sparkline/sparkline'
import styles from './kpi.module.css'

export interface KpiProps {
  value: string | number
  label: string
  /**
   * The change to show beside the value, as a **number** — `Kpi` owns the formatting
   * (sign, arrow, colour, unit). Its sibling `Stat` takes a pre-formatted `string` and
   * leaves formatting to you; that is the whole difference between the two tiles.
   */
  delta?: number
  /**
   * How to render `delta`. `'number'` (default) is locale-formatted with a sign.
   * `'percent'` treats `delta` as already being in percentage points and appends `%`
   * (`25.6` → `+25.6%`) — it does NOT multiply by 100. Pass a function for anything else;
   * it receives the raw number and owns the entire string, sign included.
   */
  deltaFormat?: 'number' | 'percent' | ((delta: number) => string)
  /**
   * Which direction is *good* for this metric — the colour, independent of the arrow.
   *
   * The arrow follows the sign of `delta`; this says whether that movement is welcome.
   * They coincide only for metrics where up is better, and assuming that made every
   * error-rate, latency, cost and churn tile render its worst news in green. Negating
   * `delta` to fix the colour also flips the arrow, so there was no correct answer.
   *
   * `'neutral'` keeps the arrow and drops the sentiment colour.
   *
   * @defaultValue `up`
   */
  goodDirection?: 'up' | 'down' | 'neutral'
  deltaLabel?: string
  icon?: ReactNode
  sparkline?: readonly number[]
  className?: string
}

function formatDelta(delta: number, format: KpiProps['deltaFormat']): string {
  if (typeof format === 'function') return format(delta)
  const sign = delta >= 0 ? '+' : ''
  const n = delta.toLocaleString(currentLocale())
  return format === 'percent' ? `${sign}${n}%` : `${sign}${n}`
}

/**
 * A metric tile with its own card chrome: label, then value and delta on one line, then an
 * optional sparkline below.
 *
 * ## `Kpi` or `Stat`? Pick one per app.
 *
 * `Stat` (`@cascivo/react`) is the sibling tile, and they are **not two skins of one
 * component**. `Kpi` takes a numeric `delta` and formats it for you (sign, arrow, colour,
 * unit) and always brings card chrome. `Stat` takes a pre-formatted `string` delta, stacks
 * value → delta → help text, puts its `visual` in a trailing slot, and is layout-only unless
 * you set `card`.
 *
 * `<Stat card>` matches this component's **chrome** — surface, border, radius, padding — and
 * not its layout, so a `Stat` row and a `Kpi` row in one app still read as two tile designs
 * (2026-08-14 report §6). Use `Kpi` when you have a numeric delta and a sparkline; use `Stat`
 * otherwise; do not mix them.
 */
export function Kpi({
  value,
  label,
  delta,
  deltaFormat = 'number',
  goodDirection = 'up',
  deltaLabel,
  icon,
  sparkline,
  className,
}: KpiProps) {
  const deltaPositive = delta != null && delta >= 0
  const deltaNegative = delta != null && delta < 0
  const trend = deltaPositive ? 'up' : deltaNegative ? 'down' : 'flat'

  return (
    <div className={[styles['kpi'], className].filter(Boolean).join(' ')}>
      <div className={styles['head']}>
        <span className={styles['label']}>{label}</span>
        {icon && <span aria-hidden="true">{icon}</span>}
      </div>
      <div className={styles['valueRow']}>
        <span className={styles['value']}>
          {typeof value === 'number' ? value.toLocaleString(currentLocale()) : value}
        </span>
        {delta != null && (
          <span
            role="img"
            className={styles['delta']}
            data-trend={trend}
            data-sentiment={sentimentOf(trend, goodDirection)}
            aria-label={`Trend: ${formatDelta(delta, deltaFormat)}${deltaLabel ? ` ${deltaLabel}` : ''}`}
          >
            {deltaPositive ? '▲' : deltaNegative ? '▼' : '–'} {formatDelta(delta, deltaFormat)}
            {deltaLabel && ` ${deltaLabel}`}
          </span>
        )}
      </div>
      {sparkline && sparkline.length > 0 && (
        <Sparkline data={sparkline} label={`${label} trend`} height={32} />
      )}
    </div>
  )
}
