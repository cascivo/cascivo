'use client'
import type { ReactNode } from 'react'

export type FillKind = 'solid' | 'gradient' | 'pattern'
export type PatternKind = 'dots' | 'lines' | 'cross'

export interface DefSeries {
  id: string
  color: string
}

/** Make a string safe to use inside an SVG fragment id (strip non-id chars). */
function safe(s: string): string {
  return s.replace(/[^a-zA-Z0-9_-]/g, '')
}

export function gradientId(prefix: string, seriesId: string): string {
  return `${safe(prefix)}-grad-${safe(seriesId)}`
}

export function patternId(prefix: string, seriesId: string): string {
  return `${safe(prefix)}-pat-${safe(seriesId)}`
}

/**
 * Resolve a series' fill: a `url(#id)` referencing a `<ChartDefs>` gradient/pattern,
 * or the solid color when `fill === 'solid'`.
 */
export function fillFor(prefix: string, seriesId: string, fill: FillKind, color: string): string {
  if (fill === 'gradient') return `url(#${gradientId(prefix, seriesId)})`
  if (fill === 'pattern') return `url(#${patternId(prefix, seriesId)})`
  return color
}

export interface ChartDefsProps {
  /** Unique per-chart prefix — pass a `useId()` so two charts on a page don't collide. */
  prefix: string
  series: readonly DefSeries[]
  fill: FillKind
  patternKind?: PatternKind | undefined
}

/**
 * Mint theme-derived SVG `<defs>` for the given series. Gradients fade the series
 * color top→bottom; patterns stroke a dot/line/cross motif in the series color over
 * a faint tint. All colors come from the resolved palette, so they stay CVD-safe.
 */
export function ChartDefs({
  prefix,
  series,
  fill,
  patternKind = 'dots',
}: ChartDefsProps): ReactNode {
  if (fill === 'solid') return null
  return (
    <defs>
      {series.map((s) =>
        fill === 'gradient' ? (
          <linearGradient key={s.id} id={gradientId(prefix, s.id)} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={s.color} stopOpacity={0.9} />
            <stop offset="100%" stopColor={s.color} stopOpacity={0.1} />
          </linearGradient>
        ) : (
          <pattern
            key={s.id}
            id={patternId(prefix, s.id)}
            patternUnits="userSpaceOnUse"
            width={6}
            height={6}
            patternTransform="rotate(45)"
          >
            <rect width={6} height={6} fill={s.color} fillOpacity={0.12} />
            {patternKind === 'dots' && <circle cx={3} cy={3} r={1.2} fill={s.color} />}
            {patternKind === 'lines' && (
              <line x1={0} y1={0} x2={0} y2={6} stroke={s.color} strokeWidth={1.2} />
            )}
            {patternKind === 'cross' && (
              <>
                <line x1={0} y1={3} x2={6} y2={3} stroke={s.color} strokeWidth={1} />
                <line x1={3} y1={0} x2={3} y2={6} stroke={s.color} strokeWidth={1} />
              </>
            )}
          </pattern>
        ),
      )}
    </defs>
  )
}
