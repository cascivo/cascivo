// Tooltip: meter displays a single value, not a discrete datum set — no data-point traversal.
//
// Meter does NOT go through `ChartFrame`: it has no data points, so the tooltip, zoom,
// toolbox and keyboard-traversal machinery would all be dead weight, and its `role="meter"`
// + `aria-valuenow` semantics are not the `role="img"` a frame gives an SVG. It DOES use
// `useChartSize`, because its `width` prop documents container-tracking behaviour and until
// 2026-08 it hard-coded `width = 200` with no viewBox — the doc was simply false. That
// mismatch is what `chart-frame-parity` now checks.
import { useChartSize } from '../../core/use-chart'
import { arcPath } from '../../engine/shape'
import styles from './meter.module.css'

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
   * `bar` draws a straight horizontal track; `gauge` draws a half-donut dial.
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
  width: fixedWidth,
  height,
}: MeterProps) {
  // 200 is a SEED, not a default: `useChartSize` overwrites it from the ResizeObserver and
  // only ever writes a measurement > 0, so an unmeasured container keeps the seed.
  const { ref, width: measured } = useChartSize(200, 100)
  const width = fixedWidth ?? measured.value
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
        ref={ref}
        className={styles['meter']}
        aria-label={label}
        role="meter"
        aria-valuenow={value}
        aria-valuemin={min}
        aria-valuemax={max}
      >
        <svg
          className={styles['svg']}
          width={svgW}
          height={svgH}
          viewBox={`0 0 ${svgW} ${svgH}`}
          aria-hidden="true"
        >
          <path d={totalPath} fill="var(--cascivo-color-border)" />
          {fillPath && <path d={fillPath} fill={color} />}
        </svg>
        <div className={styles['gaugeLabel']}>
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
      ref={ref}
      className={styles['meter']}
      aria-label={label}
      role="meter"
      aria-valuenow={value}
      aria-valuemin={min}
      aria-valuemax={max}
    >
      <svg
        className={styles['svg']}
        width={barW}
        height={barH}
        viewBox={`0 0 ${barW} ${barH}`}
        aria-hidden="true"
      >
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
          className={styles['fill']}
          style={{ transform: `scaleX(${ratio})` }}
        />
      </svg>
      <div className={styles['label']}>{label}</div>
    </div>
  )
}
