/**
 * `Sparkline`, drawn on `MiniFrame` instead of `ChartFrame` — the implementation behind the
 * `@cascivo/charts/sparkline` subpath.
 *
 * Same props, same markup, same styling as the `Sparkline` exported from `@cascivo/charts`.
 * The one difference is stated on `SparklineProps` in the barrel and in the package README:
 * **no hover tooltip**, because the tooltip is what pulls the chart engine in, and this
 * entry exists so a page can render a trend line without it.
 *
 * No `'use client'`: like the chart it mirrors this is `clientJs: 'none'`, and `MiniFrame`
 * uses no hook, so the whole subpath renders on the server and never hydrates.
 */
import { linearScale } from '../../engine/scale'
import { linePath } from '../../engine/shape'
import type { Point } from '../../engine/shape'
import { MiniFrame } from '../../core/mini-frame'

interface SparklineLiteBaseProps {
  data: readonly number[]
  /**
   * SVG width in px. **This chart is fixed-width by default** — it is a compact, inline
   * chart meant to sit in a table cell or beside a label, so omitting `width` gives you
   * 120px rather than a container-filling chart.
   *
   * @defaultValue `120`
   */
  width?: number
  height?: number
  color?: string
  /**
   * Show dot at last data point
   *
   * @defaultValue `true`
   */
  endDot?: boolean
  className?: string
}

/**
 * Exactly one of `label` / `ariaLabel` is required — a chart with no accessible name is a
 * bug, so this stays enforced by the type. `ariaLabel` is the catalog's convention for an
 * invisible accessible name; `Sparkline` predates it and shipped `label`, so both work.
 */
export type SparklineLiteProps = SparklineLiteBaseProps &
  ({ label: string; ariaLabel?: never } | { ariaLabel: string; label?: never })

export function Sparkline({
  data,
  width = 120,
  height = 32,
  label,
  ariaLabel,
  color = 'var(--cascivo-chart-1)',
  endDot = true,
  className,
}: SparklineLiteProps) {
  const pad = 2
  const points: Point[] = (() => {
    if (data.length === 0) return []
    const xScale = linearScale([0, data.length - 1], [pad, width - pad])
    const yMin = Math.min(...data)
    const yMax = Math.max(...data)
    const yScale = linearScale([yMin === yMax ? yMin - 1 : yMin, yMax], [height - pad, pad])
    return data.map((v, i) => [xScale.map(i), yScale.map(v)])
  })()
  const last = points[points.length - 1]

  return (
    <MiniFrame
      title={(label ?? ariaLabel) as string}
      width={width}
      height={height}
      {...(className !== undefined ? { className } : {})}
    >
      {points.length > 0 && (
        <>
          <path
            d={linePath(points, 'monotone')}
            fill="none"
            stroke={color}
            strokeWidth={1.5}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          {endDot && last && <circle cx={last[0]} cy={last[1]} r={2.5} fill={color} />}
        </>
      )}
    </MiniFrame>
  )
}
