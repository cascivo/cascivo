'use client'
// Tooltip: KPI displays a single aggregate value — no data-point traversal.
import type { ReactNode } from 'react'
import { Sparkline } from '../sparkline/sparkline'

export interface KpiProps {
  value: string | number
  label: string
  delta?: number
  deltaLabel?: string
  icon?: ReactNode
  sparkline?: readonly number[]
  className?: string
}

function formatDelta(delta: number): string {
  const sign = delta >= 0 ? '+' : ''
  return `${sign}${delta.toLocaleString()}`
}

export function Kpi({ value, label, delta, deltaLabel, icon, sparkline, className }: KpiProps) {
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
          {typeof value === 'number' ? value.toLocaleString() : value}
        </span>
        {delta != null && (
          <span
            style={{
              fontSize: 'var(--cascivo-text-sm)',
              fontWeight: 500,
              color: deltaPositive
                ? 'var(--cascivo-color-success)'
                : deltaNegative
                  ? 'var(--cascivo-color-destructive)'
                  : 'var(--cascivo-color-foreground-muted)',
            }}
            aria-label={`Trend: ${formatDelta(delta)}${deltaLabel ? ` ${deltaLabel}` : ''}`}
          >
            {deltaPositive ? '▲' : deltaNegative ? '▼' : '–'} {formatDelta(delta)}
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
