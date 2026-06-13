'use client'
import { ChartFrame } from '../../core/chart-frame'
import { linearScale } from '../../engine/scale'
import { linePath } from '../../engine/shape'
import type { Point } from '../../engine/shape'
import type { ChartPoint, TooltipModel } from '../../core/data-point'

export interface SparklineProps {
  data: readonly number[]
  width?: number
  height?: number
  label: string
  color?: string
  endDot?: boolean
}

export function Sparkline({
  data,
  width = 120,
  height = 32,
  label,
  color = 'var(--cascade-chart-1)',
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
      title={label}
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
