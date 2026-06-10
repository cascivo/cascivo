'use client'
import { useSignal, useSignals } from '@cascade-ui/core'
import { ChartFrame } from '../../core/chart-frame'
import { DEFAULT_MARGINS } from '../../core/use-chart'
import { Axis } from '../../chrome/axis'
import { GridLines } from '../../chrome/grid-lines'
import { Legend } from '../../chrome/legend'
import { linearScale } from '../../engine/scale'

export interface ScatterDatum {
  x: number
  y: number
  r?: number
}

export interface ScatterChartSeries {
  id: string
  label: string
  data: readonly ScatterDatum[]
  color?: string
}

export interface ScatterChartProps {
  series: readonly ScatterChartSeries[]
  title: string
  description?: string
  r?: number | ((d: ScatterDatum) => number)
  width?: number
  height?: number
  xTicks?: number
  yTicks?: number
  legend?: boolean
  className?: string
}

const COLORS = Array.from({ length: 8 }, (_, i) => `var(--cascade-chart-${i + 1})`)

export function ScatterChart({
  series,
  title,
  description,
  r: rProp = 4,
  width: fixedWidth,
  height = 300,
  xTicks = 5,
  yTicks = 5,
  legend: showLegend = series.length > 1,
  className,
}: ScatterChartProps) {
  useSignals()
  const hidden = useSignal(new Set<string>())
  const margins = DEFAULT_MARGINS

  const allX = series.flatMap((s) => s.data.map((d) => d.x))
  const allY = series.flatMap((s) => s.data.map((d) => d.y))
  const hasData = allX.length > 0

  const xMin = hasData ? Math.min(...allX) : 0
  const xMax = hasData ? Math.max(...allX) : 1
  const yMin = hasData ? Math.min(0, ...allY) : 0
  const yMax = hasData ? Math.max(...allY) : 1

  const fallback = (
    <table>
      <caption>{title}</caption>
      <thead>
        <tr>
          <th>Series</th>
          <th>X</th>
          <th>Y</th>
        </tr>
      </thead>
      <tbody>
        {series.flatMap((s) =>
          s.data.map((d, i) => (
            <tr key={`${s.id}-${i}`}>
              <td>{s.label}</td>
              <td>{d.x}</td>
              <td>{d.y}</td>
            </tr>
          )),
        )}
      </tbody>
    </table>
  )

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
      <ChartFrame
        title={title}
        description={description}
        width={fixedWidth}
        height={height}
        fallback={fallback}
        className={className}
        data-state={hasData ? undefined : 'empty'}
      >
        {({ width, height: h }) => {
          const innerW = width - margins.left - margins.right
          const innerH = h - margins.top - margins.bottom
          const xScale = linearScale([xMin, xMax], [0, innerW])
          const yScale = linearScale([yMin, yMax], [innerH, 0])

          return (
            <g>
              <g transform={`translate(${margins.left},${margins.top})`}>
                <GridLines scale={yScale} orientation="y" length={innerW} tickCount={yTicks} />
                {series.map((s, si) => {
                  if (hidden.value.has(s.id)) return null
                  const color = s.color ?? COLORS[si % COLORS.length]!
                  return (
                    <g key={s.id} data-series={s.id}>
                      {s.data.map((d, di) => {
                        const radius = typeof rProp === 'function' ? rProp(d) : (d.r ?? rProp)
                        return (
                          <circle
                            key={di}
                            cx={xScale.map(d.x)}
                            cy={yScale.map(d.y)}
                            r={radius}
                            fill={color}
                            fillOpacity={0.7}
                            stroke={color}
                            strokeWidth={1}
                          />
                        )
                      })}
                    </g>
                  )
                })}
                <Axis
                  scale={xScale}
                  orientation="x"
                  length={innerW}
                  tickCount={xTicks}
                  transform={`translate(0,${innerH})`}
                />
                <Axis scale={yScale} orientation="y" length={innerH} tickCount={yTicks} />
              </g>
            </g>
          )
        }}
      </ChartFrame>
      {showLegend && (
        <Legend
          series={series.map((s, i) => ({
            id: s.id,
            label: s.label,
            color: s.color ?? COLORS[i % COLORS.length]!,
          }))}
          hidden={hidden}
        />
      )}
    </div>
  )
}
