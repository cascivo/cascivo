import { ChartFrame } from '../../core/chart-frame'
import { linearScale } from '../../engine/scale'
import { linePath } from '../../engine/shape'
import type { Point } from '../../engine/shape'
import type { ChartPoint, TooltipModel } from '../../core/data-point'

interface SparklineBaseProps {
  data: readonly number[]
  /**
   * SVG width in px. **This chart is fixed-width by default** — it is a compact, inline
   * chart meant to sit in a table cell or beside a label, so omitting `width` gives you
   * 120px rather than a container-filling chart. Pass a number to change it. The
   * catalogue-wide "omit for a responsive chart" note does not apply to this chart.
   *
   * @defaultValue `80`
   * @see the component manifest
   */
  width?: number
  height?: number
  color?: string
  endDot?: boolean
}

/**
 * Exactly one of `label` / `ariaLabel` is required — a chart with no accessible name is a
 * bug, so this stays enforced by the type. `ariaLabel` is the catalog's convention for an
 * invisible accessible name (here, the SVG `<title>`); `Sparkline` predates it and shipped
 * `label`, so both work and neither is deprecated.
 */
export type SparklineProps = SparklineBaseProps &
  ({ label: string; ariaLabel?: never } | { ariaLabel: string; label?: never })

export function Sparkline({
  data,
  width = 120,
  height = 32,
  label,
  ariaLabel,
  color = 'var(--cascivo-chart-1)',
  endDot = true,
}: SparklineProps) {
  const pad = 2

  const buildTooltip = (): TooltipModel | undefined => {
    if (data.length === 0) return undefined
    const xScale = linearScale([0, data.length - 1], [pad, width - pad])
    const yMin = Math.min(...data)
    const yMax = Math.max(...data)
    const yScale = linearScale([yMin === yMax ? yMin - 1 : yMin, yMax], [height - pad, pad])
    const points: ChartPoint[] = data.map((v, i) => ({
      id: String(i),
      cx: xScale.map(i),
      cy: yScale.map(v),
      label: String(i),
      value: v,
    }))
    return { points }
  }

  return (
    <ChartFrame
      title={(label ?? ariaLabel) as string}
      width={width}
      height={height}
      plain
      tooltip={data.length > 0 ? buildTooltip() : undefined}
    >
      {() => {
        if (data.length === 0) return null

        const xScale = linearScale([0, data.length - 1], [pad, width - pad])
        const yMin = Math.min(...data)
        const yMax = Math.max(...data)
        const yScale = linearScale([yMin === yMax ? yMin - 1 : yMin, yMax], [height - pad, pad])

        const points: Point[] = data.map((v, i) => [xScale.map(i), yScale.map(v)])
        const d = linePath(points, 'monotone')
        const last = points[points.length - 1]!

        return (
          <>
            <path
              d={d}
              fill="none"
              stroke={color}
              strokeWidth={1.5}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            {endDot && <circle cx={last[0]} cy={last[1]} r={2.5} fill={color} />}
          </>
        )
      }}
    </ChartFrame>
  )
}
