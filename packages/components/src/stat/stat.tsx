import { cn, sentimentOf } from '@cascivo/core/pure'
import type { HTMLAttributes, ReactNode } from 'react'
import styles from './stat.module.css'

export interface StatProps extends Omit<HTMLAttributes<HTMLDivElement>, 'children'> {
  label: string
  value: string | number
  delta?: string
  trend?: 'up' | 'down' | 'flat'
  /**
   * Which direction is *good* for this metric — the colour, independent of the arrow.
   *
   * `trend` says which way the number moved; this says whether that is welcome. They are
   * the same question only for metrics where up is better, and hard-coding that made every
   * error-rate, latency, cost and churn tile render its worst news in green. Lying about
   * `trend` to fix the colour also reverses the arrow, so there was no correct answer.
   *
   * `'neutral'` keeps the arrow and drops the sentiment colour, for metrics where neither
   * direction is inherently good (headcount, page views).
   *
   * @defaultValue `up`
   */
  goodDirection?: 'up' | 'down' | 'neutral'
  helpText?: string
  /**
   * Wrap the tile in the same card chrome (surface, border, radius, padding) that
   * `@cascivo/charts`' `Kpi` ships. `Stat` is layout-only by default so it can sit inside
   * a `Card` you control; `Kpi` always brings its own chrome, which made a `Stat` row and
   * a `Kpi` row on adjacent pages of one dashboard look like different products. Set this
   * when you are mixing the two, or use it instead of hand-wrapping every `Stat` in a `Card`.
   *
   * ⚠ **`card` matches the CHROME only — the internal layout still differs, so do not mix
   * `Stat` and `Kpi` in one app.** `Kpi` puts value and delta on one line with the sparkline
   * below; `Stat` stacks value → delta → help text and puts `visual` in a trailing slot.
   * With `card` set they share surface, border, radius and padding and still read as two
   * tile designs (2026-08-14 report §6 — the exact symptom this prop was added to cure, on
   * an overview page using `Stat card` next to an analytics page using `Kpi`).
   *
   * Pick one per app: `Kpi` when you have a numeric delta it should format and a sparkline;
   * `Stat` otherwise.
   */
  card?: boolean
  /** Trailing visual, e.g. a `Sparkline` from the separate `@cascivo/charts` package (not exported from `@cascivo/react`; `pnpm add @cascivo/charts`). Purely decorative — mark it `aria-hidden` yourself if it duplicates the value/delta already announced. */
  visual?: ReactNode
}

export function Stat({
  label,
  value,
  delta,
  trend = 'flat',
  goodDirection = 'up',
  helpText,
  card = false,
  visual,
  className,
  ...props
}: StatProps) {
  return (
    <div
      data-card={card || undefined}
      className={cn(styles['stat'], className as string | undefined)}
      {...props}
    >
      <span className={styles['label']}>{label}</span>
      <span className={styles['value']}>{value}</span>
      {delta && (
        <span
          data-trend={trend}
          data-sentiment={sentimentOf(trend, goodDirection)}
          className={styles['delta']}
        >
          <span aria-hidden="true" className={styles['arrow']}>
            {trend === 'up' ? '▲' : trend === 'down' ? '▼' : '–'}
          </span>
          {delta}
        </span>
      )}
      {helpText && <span className={styles['help']}>{helpText}</span>}
      {visual && <span className={styles['visual']}>{visual}</span>}
    </div>
  )
}
