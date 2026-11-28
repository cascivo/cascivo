'use client'
import { useId } from 'react'
import type { CSSProperties } from 'react'
import { sentimentOf } from '@cascivo/core'
import { currentLocale, t } from '@cascivo/i18n'
import { msg } from '../i18n'
import styles from './KpiTile.module.css'

export interface KpiTileProps {
  label: string
  /** The formatted current value, without its unit. */
  value: string
  unit: string
  /** Percent change against the recent baseline. */
  delta: number
  goodDirection: 'up' | 'down'
  /** Recent history, oldest first; drawn edge to edge along the tile's foot. */
  series: readonly number[]
  /** Formats a series value for the low/peak readouts and the target label. */
  format: (v: number) => string
  /** An objective drawn as a rule across the trend; crossing it turns the tile hot. */
  target?: number
  /** Draw at index i in the stagger of the page's entrance. */
  index: number
}

// The trend's drawing box. The path is stretched to the tile's width (preserveAspectRatio
// none, non-scaling strokes), so only the vertical units matter; the last point stops short
// of the edge so its marker is not clipped.
const W = 100
const H = 48
const X_END = 98.5
const TOP = 6
const BOTTOM = 44

/**
 * A headline metric that fills its tile: label and delta on one line, the value large with
 * its low/peak beside it, and the recent trend as a full-bleed gradient area along the foot,
 * with the objective as a labelled rule. The tile wears the theme accent; past its objective
 * it switches to the hot end of the heat ramp and says so in words.
 */
export function KpiTile({
  label,
  value,
  unit,
  delta,
  goodDirection,
  series,
  format,
  target,
  index,
}: KpiTileProps) {
  const gradient = `pulse-kpi-${useId().replace(/[^a-zA-Z0-9_-]/g, '')}`
  const now = series[series.length - 1] ?? 0
  const low = series.length > 0 ? Math.min(...series) : 0
  const peak = series.length > 0 ? Math.max(...series) : 0
  const breached = target != null && (goodDirection === 'down' ? now > target : now < target)

  // The domain takes in the objective, so its rule always lands inside the plot.
  const lo = Math.min(low, target ?? low)
  const hi = Math.max(peak, target ?? peak)
  const span = hi - lo || 1
  const yOf = (v: number) => BOTTOM - ((v - lo) / span) * (BOTTOM - TOP)
  const xOf = (i: number) => (series.length > 1 ? (i / (series.length - 1)) * X_END : X_END)
  const line = series
    .map((v, i) => `${i === 0 ? 'M' : 'L'}${xOf(i).toFixed(2)},${yOf(v).toFixed(2)}`)
    .join('')
  const area = `${line}L${X_END},${H}L0,${H}Z`

  const trend = delta > 0 ? 'up' : delta < 0 ? 'down' : 'flat'
  const sentiment = sentimentOf(trend, goodDirection)
  const nf = new Intl.NumberFormat(currentLocale(), {
    maximumFractionDigits: 1,
    signDisplay: 'exceptZero',
  })

  const pct = (v: number) => `${((v / H) * 100).toFixed(2)}%`
  const geometry = {
    '--i': index,
    '--end-x': `${X_END}%`,
    '--end-y': pct(yOf(now)),
    ...(target != null ? { '--target-y': pct(yOf(target)) } : {}),
  } as CSSProperties

  return (
    <article
      className={styles['tile']}
      data-breach={breached ? '' : undefined}
      style={geometry}
      aria-label={label}
    >
      <header className={styles['head']}>
        <h3 className={styles['label']}>{label}</h3>
        <span
          className={styles['delta']}
          data-sentiment={sentiment}
          role="img"
          aria-label={t(msg.kpiDelta, { delta: `${nf.format(delta)}%` })}
        >
          <span aria-hidden="true">{trend === 'up' ? '▲' : trend === 'down' ? '▼' : '–'}</span>
          {nf.format(delta)}%
        </span>
      </header>

      <div className={styles['body']}>
        <p className={styles['value']}>
          {value}
          <span className={styles['unit']}>{unit}</span>
        </p>
        <dl className={styles['range']}>
          <div>
            <dt>{t(msg.kpiPeak)}</dt>
            <dd>{format(peak)}</dd>
          </div>
          <div>
            <dt>{t(msg.kpiLow)}</dt>
            <dd>{format(low)}</dd>
          </div>
        </dl>
      </div>

      <div className={styles['trend']}>
        <svg
          className={styles['plot']}
          viewBox={`0 0 ${W} ${H}`}
          preserveAspectRatio="none"
          aria-hidden="true"
          focusable="false"
        >
          <defs>
            <linearGradient id={gradient} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" className={styles['stopTop']} />
              <stop offset="100%" className={styles['stopBottom']} />
            </linearGradient>
          </defs>
          <path d={area} fill={`url(#${gradient})`} />
          <path d={line} className={styles['line']} />
        </svg>
        {target != null && (
          <span className={styles['target']}>
            <span className={styles['targetLabel']}>
              {breached
                ? t(msg.kpiOverTarget, { value: format(target) })
                : t(msg.kpiTarget, { value: format(target) })}
            </span>
          </span>
        )}
        <span className={styles['end']} aria-hidden="true" />
      </div>
    </article>
  )
}
