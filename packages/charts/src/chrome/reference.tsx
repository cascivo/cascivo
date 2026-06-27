'use client'
import type { ReactNode } from 'react'

/** A scale that maps a domain value to a pixel position within the plot area. */
export interface AnnotationScale {
  map: (value: never) => number | undefined
  /** Band scales place a category at its start; add half the bandwidth to center. */
  bandwidth?: number
}

/**
 * A declarative chart annotation. `line` draws a threshold/target rule across the
 * plot; `area` shades a band between two values; `dot` marks a single point.
 */
export type Annotation =
  | {
      kind: 'line'
      /** Which axis the `value` is measured on. */
      axis: 'x' | 'y'
      value: number | string | Date
      label?: string
      color?: string
      /** Dashed rule (default) vs solid. */
      dash?: boolean
    }
  | {
      kind: 'area'
      axis: 'x' | 'y'
      from: number | string | Date
      to: number | string | Date
      label?: string
      color?: string
    }
  | {
      kind: 'dot'
      x: number | string | Date
      y: number
      label?: string
      color?: string
    }

export interface AnnotationContext {
  xScale: AnnotationScale
  yScale: AnnotationScale
  innerW: number
  innerH: number
}

const LINE_COLOR = 'var(--cascivo-color-foreground-muted)'
const AREA_COLOR = 'var(--cascivo-color-accent)'

function center(scale: AnnotationScale, value: unknown): number | undefined {
  const pos = scale.map(value as never)
  if (pos == null || Number.isNaN(pos)) return undefined
  return scale.bandwidth ? pos + scale.bandwidth / 2 : pos
}

/** Render a single annotation against the resolved scales. Returns null if it maps off-scale. */
export function renderAnnotation(
  annotation: Annotation,
  ctx: AnnotationContext,
  key: number,
): ReactNode {
  const { xScale, yScale, innerW, innerH } = ctx

  if (annotation.kind === 'line') {
    const scale = annotation.axis === 'x' ? xScale : yScale
    const pos = center(scale, annotation.value)
    if (pos == null) return null
    const color = annotation.color ?? LINE_COLOR
    const dash = annotation.dash !== false
    const isX = annotation.axis === 'x'
    return (
      <g key={key} data-annotation="line" aria-hidden="true">
        <line
          x1={isX ? pos : 0}
          y1={isX ? 0 : pos}
          x2={isX ? pos : innerW}
          y2={isX ? innerH : pos}
          stroke={color}
          strokeWidth={1.5}
          {...(dash && { strokeDasharray: '4 3' })}
        >
          <title>{annotation.label ?? String(annotation.value)}</title>
        </line>
        {annotation.label != null &&
          (isX ? (
            <text x={pos + 4} y={10} fontSize="0.6875rem" fill={color} textAnchor="start">
              {annotation.label}
            </text>
          ) : (
            <text x={innerW - 4} y={pos - 4} fontSize="0.6875rem" fill={color} textAnchor="end">
              {annotation.label}
            </text>
          ))}
      </g>
    )
  }

  if (annotation.kind === 'area') {
    const scale = annotation.axis === 'x' ? xScale : yScale
    const a = center(scale, annotation.from)
    const b = center(scale, annotation.to)
    if (a == null || b == null) return null
    const color = annotation.color ?? AREA_COLOR
    const isX = annotation.axis === 'x'
    const start = Math.min(a, b)
    const len = Math.abs(b - a)
    return (
      <g key={key} data-annotation="area" aria-hidden="true">
        <rect
          x={isX ? start : 0}
          y={isX ? 0 : start}
          width={isX ? len : innerW}
          height={isX ? innerH : len}
          fill={color}
          fillOpacity={0.12}
        >
          <title>{annotation.label ?? `${String(annotation.from)}–${String(annotation.to)}`}</title>
        </rect>
      </g>
    )
  }

  // dot
  const cx = center(xScale, annotation.x)
  const cy = center(yScale, annotation.y)
  if (cx == null || cy == null) return null
  const color = annotation.color ?? AREA_COLOR
  return (
    <g key={key} data-annotation="dot" aria-hidden="true">
      <circle
        cx={cx}
        cy={cy}
        r={4}
        fill={color}
        stroke="var(--cascivo-color-background)"
        strokeWidth={1.5}
      >
        <title>{annotation.label ?? `${String(annotation.x)}, ${annotation.y}`}</title>
      </circle>
      {annotation.label != null && (
        <text x={cx + 6} y={cy - 6} fontSize="0.6875rem" fill={color} textAnchor="start">
          {annotation.label}
        </text>
      )}
    </g>
  )
}

/** Render every annotation in the list against the resolved scales. */
export function renderAnnotations(
  annotations: readonly Annotation[] | undefined,
  ctx: AnnotationContext,
): ReactNode {
  if (!annotations || annotations.length === 0) return null
  return <g data-annotations="">{annotations.map((a, i) => renderAnnotation(a, ctx, i))}</g>
}

/** Short human summary of an annotation, for the chart description / a11y tree. */
export function annotationSummary(a: Annotation): string {
  if (a.kind === 'line') return a.label ?? `${a.axis}=${String(a.value)}`
  if (a.kind === 'area') return a.label ?? `${a.axis} ${String(a.from)}–${String(a.to)}`
  return a.label ?? `(${String(a.x)}, ${a.y})`
}
