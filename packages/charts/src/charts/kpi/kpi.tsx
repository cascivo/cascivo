'use client'
// Tooltip: KPI displays a single aggregate value — no data-point traversal.
import type { ReactNode } from 'react'
import { currentLocale } from '@cascivo/i18n'
import { Sparkline } from '../sparkline/sparkline'

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

export function Kpi({
  value,
  label,
  delta,
  deltaFormat = 'number',
  deltaLabel,
  icon,
  sparkline,
  className,
}: KpiProps) {
  const deltaPositive = delta != null && delta >= 0
  const deltaNegative = delta != null && delta < 0

  return (
    <div
      className={className}
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--cascivo-space-2)',
        padding: 'var(--cascivo-space-4)',
        borderRadius: 'var(--cascivo-radius-surface)',
        border: '1px solid var(--cascivo-color-border)',
        background: 'var(--cascivo-color-surface)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span
          style={{
            fontSize: 'var(--cascivo-text-sm)',
            color: 'var(--cascivo-color-foreground-muted)',
          }}
        >
          {label}
        </span>
        {icon && <span aria-hidden="true">{icon}</span>}
      </div>
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 'var(--cascivo-space-2)' }}>
        <span
          style={{
            fontSize: 'var(--cascivo-text-2xl)',
            fontWeight: 700,
            lineHeight: 1,
            color: 'var(--cascivo-color-foreground)',
          }}
        >
          {typeof value === 'number' ? value.toLocaleString(currentLocale()) : value}
        </span>
        {delta != null && (
          <span
            role="img"
            style={{
              fontSize: 'var(--cascivo-text-sm)',
              fontWeight: 500,
              color: deltaPositive
                ? 'var(--cascivo-color-success-foreground)'
                : deltaNegative
                  ? 'var(--cascivo-color-destructive-foreground)'
                  : 'var(--cascivo-color-foreground-muted)',
            }}
            aria-label={`Trend: ${formatDelta(delta, deltaFormat)}${deltaLabel ? ` ${deltaLabel}` : ''}`}
          >
            {deltaPositive ? '▲' : deltaNegative ? '▼' : '–'} {formatDelta(delta, deltaFormat)}
            {deltaLabel && ` ${deltaLabel}`}
          </span>
        )}
      </div>
      {sparkline && sparkline.length > 0 && (
        <Sparkline data={sparkline} label={`${label} trend`} width={120} height={32} />
      )}
    </div>
  )
}
