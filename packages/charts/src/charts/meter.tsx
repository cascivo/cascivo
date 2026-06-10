'use client'
import { arcPath } from '../engine/shape'

export interface MeterThresholds {
  warning?: number
  critical?: number
}

export interface MeterProps {
  value: number
  min?: number
  max?: number
  label: string
  variant?: 'bar' | 'gauge'
  thresholds?: MeterThresholds
  width?: number
  height?: number
}

function fillColor(value: number, min: number, max: number, thresholds?: MeterThresholds): string {
  if (!thresholds) return 'var(--cascade-chart-1)'
  const { warning, critical } = thresholds
  if (critical != null && value >= critical) return 'var(--cascade-color-destructive, #ef4444)'
  if (warning != null && value >= warning) return 'var(--cascade-color-warning, #f59e0b)'
  return 'var(--cascade-color-success, #22c55e)'
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
  const color = fillColor(value, min, max, thresholds)

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
          <path d={totalPath} fill="var(--cascade-color-border, #e5e7eb)" />
          {fillPath && <path d={fillPath} fill={color} />}
        </svg>
        <div
          style={{
            textAlign: 'center',
            fontSize: '0.875rem',
            color: 'var(--cascade-color-text-muted)',
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
          fill="var(--cascade-color-border, #e5e7eb)"
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
          marginTop: '0.25rem',
          fontSize: '0.75rem',
          color: 'var(--cascade-color-text-muted)',
        }}
      >
        {label}
      </div>
    </div>
  )
}
