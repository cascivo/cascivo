'use client'
import { useSignal, useSignals } from '@cascade-ui/core'
import { ChartFrame } from '../../core/chart-frame'
import { DEFAULT_MARGINS } from '../../core/use-chart'
import { Axis } from '../../chrome/axis'
import { bandScale } from '../../engine/scale'
import { extent } from '../../engine/stats'

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
}

export function Heatmap({
  data,
  title,
  description,
  width: fixedWidth,
  height = 320,
  className,
}: HeatmapProps) {
  useSignals()
  const tooltip = useSignal<{ x: number; y: number; text: string } | null>(null)
  const margins = { top: 20, right: 20, bottom: 60, left: 60 }

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

  return (
    <ChartFrame
      title={title}
      description={description}
      width={fixedWidth}
      height={height}
      fallback={fallback}
      className={className}
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
                  fill={`color-mix(in oklab, var(--cascade-chart-1) ${pct}%, var(--cascade-color-neutral-100))`}
                  stroke="var(--cascade-surface-base)"
                  strokeWidth={1}
                  aria-label={`${d.x}, ${d.y}: ${d.value}`}
                  onMouseEnter={() => {
                    tooltip.value = {
                      x: rx + xScale.bandwidth / 2,
                      y: ry,
                      text: `${d.x}×${d.y}: ${d.value}`,
                    }
                  }}
                  onMouseLeave={() => {
                    tooltip.value = null
                  }}
                />
              )
            })}
            <Axis
              scale={xScale}
              orientation="x"
              length={inner.width}
              transform={`translate(0,${inner.height})`}
            />
            <Axis scale={yScale} orientation="y" length={inner.height} />
            {tooltip.value && (
              <text
                x={tooltip.value.x}
                y={tooltip.value.y - 6}
                fontSize={11}
                textAnchor="middle"
                fill="var(--cascade-text-primary)"
              >
                {tooltip.value.text}
              </text>
            )}
          </g>
        )
      }}
    </ChartFrame>
  )
}
