'use client'
import type { ChartPoint, TooltipModel } from './data-point'
import { defaultFormat } from './data-point'

interface ChartTooltipProps {
  point: ChartPoint
  model: TooltipModel
}

export function ChartTooltip({ point, model }: ChartTooltipProps) {
  const text = model.format ? model.format(point) : defaultFormat(point)
  const segments = point.segments?.filter((s) => s.value !== 0)
  return (
    <div
      role="tooltip"
      style={{
        position: 'absolute',
        left: point.cx + 8,
        top: Math.max(0, point.cy - 32),
        pointerEvents: 'none',
        background: 'var(--cascivo-surface-overlay, var(--cascivo-color-background))',
        color: 'var(--cascivo-text-primary, currentColor)',
        border: '1px solid var(--cascivo-color-border)',
        borderRadius: 'var(--cascivo-radius-sm, 4px)',
        padding: '0.25rem 0.5rem',
        fontSize: '0.8125rem',
        whiteSpace: 'nowrap',
        boxShadow: 'var(--cascivo-shadow-sm, 0 1px 4px rgba(0,0,0,0.1))',
        zIndex: 10,
      }}
    >
      {segments && segments.length > 0 ? (
        // Stacked breakdown: "label · total" header + each non-zero layer in its color.
        <span style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
          <span style={{ fontWeight: 600 }} data-tooltip-header="">
            {point.label} · {point.value}
          </span>
          {segments.map((s) => (
            <span key={s.label} style={s.color ? { color: s.color } : undefined}>
              {s.label}: {s.value}
            </span>
          ))}
        </span>
      ) : (
        <span style={point.color ? { color: point.color } : undefined}>{text}</span>
      )}
    </div>
  )
}
