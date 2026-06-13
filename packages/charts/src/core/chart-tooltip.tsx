'use client'
import type { ChartPoint, TooltipModel } from './data-point'
import { defaultFormat } from './data-point'

interface ChartTooltipProps {
  point: ChartPoint
  model: TooltipModel
}

export function ChartTooltip({ point, model }: ChartTooltipProps) {
  const text = model.format ? model.format(point) : defaultFormat(point)
  return (
    <div
      role="tooltip"
      style={{
        position: 'absolute',
        left: point.cx + 8,
        top: Math.max(0, point.cy - 32),
        pointerEvents: 'none',
        background: 'var(--cascade-surface-overlay, var(--cascade-color-background))',
        color: 'var(--cascade-text-primary, currentColor)',
        border: '1px solid var(--cascade-color-border)',
        borderRadius: 'var(--cascade-radius-sm, 4px)',
        padding: '0.25rem 0.5rem',
        fontSize: '0.8125rem',
        whiteSpace: 'nowrap',
        boxShadow: 'var(--cascade-shadow-sm, 0 1px 4px rgba(0,0,0,0.1))',
        zIndex: 10,
      }}
    >
      {text}
    </div>
  )
}
