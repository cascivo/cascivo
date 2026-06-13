'use client'
import { useSignals } from '@cascade-ui/core'
import { ChartFrame } from '../../core/chart-frame'
import { PLAIN_MARGINS } from '../../core/use-chart'
import { Axis } from '../../chrome/axis'
import { bandScale } from '../../engine/scale'
import { extent } from '../../engine/stats'
import type { ChartPoint, TooltipModel } from '../../core/data-point'

export interface HeatmapDatum {
  x: string
  y: string
  value: number
}

export interface HeatmapProps {
  data: HeatmapDatum[]
  title: string
  description?: string
  width?: number
  height?: number
  className?: string
  /** Render only the marks — no axes. For micro/inline charts. */
  plain?: boolean
}

export function Heatmap({
  data,
  title,
  description,
  width: fixedWidth,
  height,
  className,
  plain,
}: HeatmapProps) {
  useSignals()
  const resolvedHeight = height ?? (plain ? 48 : 320)
  const margins = plain ? PLAIN_MARGINS : { top: 20, right: 20, bottom: 60, left: 60 }

  const xs = [...new Set(data.map((d) => d.x))]
  const ys = [...new Set(data.map((d) => d.y))]
  const [vMin, vMax] = data.length > 0 ? extent(data.map((d) => d.value)) : [0, 1]
  const vRange = vMax - vMin || 1

  // Normalize 0..1
  const norm = (v: number) => Math.max(0, Math.min(1, (v - vMin) / vRange))

  const fallback = (
    <table>
      <caption>{title}</caption>
      <thead>
        <tr>
          <th>X</th>
          <th>Y</th>
          <th>Value</th>
        </tr>
      </thead>
      <tbody>
        {data.map((d, i) => (
          <tr key={i}>
            <td>{d.x}</td>
            <td>{d.y}</td>
            <td>{d.value}</td>
          </tr>
        ))}
      </tbody>
    </table>
  )

  const buildTooltip = ({
    width: w,
    height: h,
  }: {
    width: number
    height: number
  }): TooltipModel | undefined => {
    if (data.length === 0) return undefined
    const innerW = w - margins.left - margins.right
    const innerH = h - margins.top - margins.bottom
    if (innerW <= 0) return undefined
    const xScale = bandScale(xs, [0, innerW], 0.05)
    const yScale = bandScale(ys, [0, innerH], 0.05)

    const points: ChartPoint[] = data.map((d, i) => {
      const rx = xScale.map(d.x) ?? 0
      const ry = yScale.map(d.y) ?? 0
      return {
        id: `cell-${i}`,
        cx: margins.left + rx + xScale.bandwidth / 2,
        cy: margins.top + ry + yScale.bandwidth / 2,
        label: `${d.x}×${d.y}`,
        value: d.value,
      }
    })
    return { points }
  }

  return (
    <ChartFrame
      title={title}
      description={description}
      width={fixedWidth}
      height={resolvedHeight}
      fallback={fallback}
      className={className}
      plain={plain}
      tooltip={data.length > 0 ? buildTooltip : undefined}
    >
      {({ width, height: h }) => {
        const inner = {
          width: width - margins.left - margins.right,
          height: h - margins.top - margins.bottom,
        }
        if (inner.width <= 0 || data.length === 0) return null

        const xScale = bandScale(xs, [0, inner.width], 0.05)
        const yScale = bandScale(ys, [0, inner.height], 0.05)

        return (
          <g transform={`translate(${margins.left},${margins.top})`}>
            {data.map((d, i) => {
              const rx = xScale.map(d.x) ?? 0
              const ry = yScale.map(d.y) ?? 0
              const pct = Math.round(norm(d.value) * 100)
              return (
                <rect
                  key={i}
                  x={rx}
                  y={ry}
                  width={xScale.bandwidth}
                  height={yScale.bandwidth}
                  fill={`color-mix(in oklab, var(--cascivo-chart-1) ${pct}%, var(--cascivo-color-neutral-100))`}
                  stroke="var(--cascivo-surface-base)"
                  strokeWidth={1}
                  aria-label={`${d.x}, ${d.y}: ${d.value}`}
                />
              )
            })}
            {!plain && (
              <>
                <Axis
                  scale={xScale}
                  orientation="x"
                  length={inner.width}
                  transform={`translate(0,${inner.height})`}
                />
                <Axis scale={yScale} orientation="y" length={inner.height} />
              </>
            )}
          </g>
        )
      }}
    </ChartFrame>
  )
}
