'use client'
import type { ReactNode } from 'react'
import { Sparkline } from './sparkline'

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
        gap: 'var(--cascade-space-2, 0.5rem)',
        padding: 'var(--cascade-space-4, 1rem)',
        borderRadius: 'var(--cascade-radius-md, 8px)',
        border: '1px solid var(--cascade-color-border, #e5e7eb)',
        background: 'var(--cascade-color-surface, #fff)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span
          style={{
            fontSize: 'var(--cascade-font-size-sm, 0.875rem)',
            color: 'var(--cascade-color-text-muted, #6b7280)',
          }}
        >
          {label}
        </span>
        {icon && <span aria-hidden="true">{icon}</span>}
      </div>
      <div
        style={{ display: 'flex', alignItems: 'flex-end', gap: 'var(--cascade-space-2, 0.5rem)' }}
      >
        <span
          style={{
            fontSize: 'var(--cascade-font-size-2xl, 1.5rem)',
            fontWeight: 700,
            lineHeight: 1,
            color: 'var(--cascade-color-text, #111)',
          }}
        >
          {typeof value === 'number' ? value.toLocaleString() : value}
        </span>
        {delta != null && (
          <span
            style={{
              fontSize: 'var(--cascade-font-size-sm, 0.875rem)',
              fontWeight: 500,
              color: deltaPositive
                ? 'var(--cascade-color-success, #22c55e)'
                : deltaNegative
                  ? 'var(--cascade-color-destructive, #ef4444)'
                  : 'var(--cascade-color-text-muted, #6b7280)',
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
