// Tooltip: meter displays a single value, not a discrete datum set — no data-point traversal.
import { arcPath } from '../../engine/shape'

export interface MeterThresholds {
  warning?: number
  critical?: number
}

export interface MeterProps {
  value: number
  /**
   * Minimum allowed value.
   *
   * @defaultValue `0`
   * @see the component manifest
   */
  min?: number
  /**
   * Maximum allowed value.
   *
   * @defaultValue `100`
   * @see the component manifest
   */
  max?: number
  label: string
  /**
   * Selects the visual style variant.
   *
   * @defaultValue `bar`
   * @see the component manifest
   */
  variant?: 'bar' | 'gauge'
  thresholds?: MeterThresholds
  /**
   * Fixed SVG width in px. ⚠ **Omit for a responsive chart** — the chart fills and tracks
   * its container via a ResizeObserver; there is no correct pixel number in a responsive
   * grid. A fixed width is clamped to the container (max-inline-size: 100%) so it can never
   * overflow its card, but it also stops the chart growing. `useChartSize` is NOT needed for
   * this — charts call it internally.
   * @see the component manifest
   */
  width?: number
  height?: number
}

/**
 * Thresholds are absolute values compared against `value`, so the scale bounds play no part.
 * (This took `min`/`max` and ignored them until `noUnusedParameters` said so.)
 */
function fillColor(value: number, thresholds?: MeterThresholds): string {
  if (!thresholds) return 'var(--cascivo-chart-1)'
  const { warning, critical } = thresholds
  if (critical != null && value >= critical) return 'var(--cascivo-color-destructive)'
  if (warning != null && value >= warning) return 'var(--cascivo-color-warning)'
  return 'var(--cascivo-color-success)'
}

export function Meter({
  value,
  min = 0,
  max = 100,
  label,
  variant = 'bar',
  thresholds,
  width = 200,
  height,
}: MeterProps) {
  const clamped = Math.min(max, Math.max(min, value))
  const ratio = max > min ? (clamped - min) / (max - min) : 0
  const color = fillColor(value, thresholds)

  if (variant === 'gauge') {
    const svgH = height ?? 100
    const svgW = width
    const cx = svgW / 2
    const cy = svgH * 0.9
    const outerR = Math.min(cx, cy) - 4
    const innerR = outerR * 0.65
    // Half-donut: from π to 2π (left to right, bottom arc)
    const startAngle = Math.PI
    const endAngle = 2 * Math.PI
    const totalPath = arcPath(cx, cy, outerR, innerR, startAngle, endAngle)
    const fillEnd = startAngle + ratio * Math.PI
    const fillPath = ratio > 0 ? arcPath(cx, cy, outerR, innerR, startAngle, fillEnd) : ''

    return (
      <div
        aria-label={label}
        role="meter"
        aria-valuenow={value}
        aria-valuemin={min}
        aria-valuemax={max}
      >
        <svg width={svgW} height={svgH} aria-hidden="true">
          <path d={totalPath} fill="var(--cascivo-color-border)" />
          {fillPath && <path d={fillPath} fill={color} />}
        </svg>
        <div
          style={{
            textAlign: 'center',
            fontSize: 'var(--cascivo-text-sm)',
            color: 'var(--cascivo-color-foreground-muted)',
          }}
        >
          {label}: {value}
        </div>
      </div>
    )
  }

  // Bar variant — fill animated via CSS scale transform (compositor-safe)
  // Note: we use scaleX transform on the fill rect, not width/inline-size transition
  const barH = height ?? 12
  const barW = width

  return (
    <div
      aria-label={label}
      role="meter"
      aria-valuenow={value}
      aria-valuemin={min}
      aria-valuemax={max}
    >
      <svg width={barW} height={barH} aria-hidden="true" style={{ display: 'block' }}>
        <rect
          x={0}
          y={0}
          width={barW}
          height={barH}
          rx={barH / 2}
          fill="var(--cascivo-color-border)"
        />
        <rect
          x={0}
          y={0}
          width={barW}
          height={barH}
          rx={barH / 2}
          fill={color}
          style={{
            transformOrigin: 'left center',
            transform: `scaleX(${ratio})`,
            // scaleX is compositor-safe (GPU-composited transform)
            transition: 'transform 400ms ease',
          }}
        />
      </svg>
      <div
        style={{
          marginTop: 'var(--cascivo-space-1)',
          fontSize: 'var(--cascivo-text-xs)',
          color: 'var(--cascivo-color-foreground-muted)',
        }}
      >
        {label}
      </div>
    </div>
  )
}
