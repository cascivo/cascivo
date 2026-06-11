'use client'
import { useSignal, useSignals } from '@cascade-ui/core'
import { ChartFrame } from '../../core/chart-frame'
import { DEFAULT_MARGINS } from '../../core/use-chart'
import { Axis } from '../../chrome/axis'
import { GridLines } from '../../chrome/grid-lines'
import { Legend } from '../../chrome/legend'
import { linearScale, bandScale } from '../../engine/scale'
import { stackSeries } from '../../engine/shape'

export interface BarChartSeries<Datum> {
  id: string
  label: string
  data: readonly Datum[]
  color?: string
}

export interface BarChartProps<Datum = { x: string; y: number }> {
  series: readonly BarChartSeries<Datum>[]
  x: (d: Datum) => string
  y: (d: Datum) => number
  title: string
  description?: string
  orientation?: 'vertical' | 'horizontal'
  mode?: 'grouped' | 'stacked'
  width?: number
  height?: number
  xTicks?: number
  yTicks?: number
  legend?: boolean
  className?: string
}

const COLORS = Array.from({ length: 8 }, (_, i) => `var(--cascade-chart-${i + 1})`)

export function BarChart<Datum = { x: string; y: number }>({
  series,
  x,
  y,
  title,
  description,
  orientation = 'vertical',
  mode = 'grouped',
  width: fixedWidth,
  height = 300,
  xTicks = 5,
  yTicks = 5,
  legend: showLegend = series.length > 1,
  className,
}: BarChartProps<Datum>) {
  useSignals()
  const hidden = useSignal(new Set<string>())
  const margins = DEFAULT_MARGINS

  const categories = (series[0]?.data ?? []).map((d) => x(d))
  const allY = series.flatMap((s) => s.data.map((d) => y(d)))
  const hasData = categories.length > 0

  const yMin = mode === 'stacked' ? 0 : Math.min(0, ...allY)
  const yMaxStacked = hasData
    ? Math.max(...categories.map((_, i) => series.reduce((sum, s) => sum + y(s.data[i]!), 0)))
    : 1
  const yMax = mode === 'stacked' ? yMaxStacked : Math.max(1, ...allY)

  const fallback = (
    <table>
      <caption>{title}</caption>
      <thead>
        <tr>
          <th>Category</th>
          {series.map((s) => (
            <th key={s.id}>{s.label}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {categories.map((cat, i) => (
          <tr key={cat}>
            <td>{cat}</td>
            {series.map((s) => (
              <td key={s.id}>{s.data[i] != null ? y(s.data[i]!) : ''}</td>
            ))}
          </tr>
        ))}
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
          const isVertical = orientation === 'vertical'

          const catScale = bandScale(categories, isVertical ? [0, innerW] : [0, innerH], 0.2)
          const valScale = linearScale(
            isVertical ? [yMin, yMax] : [yMin, yMax],
            isVertical ? [innerH, 0] : [0, innerW],
          )

          const visibleSeries = series.filter((s) => !hidden.value.has(s.id))

          let stackedOffsets: [number, number][][] = []
          if (mode === 'stacked') {
            const values = series.map((s) => s.data.map((d) => y(d)))
            stackedOffsets = stackSeries(values)
          }

          return (
            <g>
              <g transform={`translate(${margins.left},${margins.top})`}>
                {isVertical ? (
                  <GridLines scale={valScale} orientation="y" length={innerW} tickCount={yTicks} />
                ) : (
                  <GridLines scale={valScale} orientation="x" length={innerH} tickCount={xTicks} />
                )}
                {visibleSeries.map((s, si) => {
                  const color = s.color ?? COLORS[series.indexOf(s) % COLORS.length]!
                  const seriesIdx = series.indexOf(s)
                  const subBandW =
                    mode === 'grouped'
                      ? catScale.bandwidth / visibleSeries.length
                      : catScale.bandwidth

                  return s.data.map((d, di) => {
                    const catPos = catScale.map(x(d)) ?? 0
                    let val: number
                    let baseVal: number
                    if (mode === 'stacked' && stackedOffsets[seriesIdx]) {
                      const offset = stackedOffsets[seriesIdx]![di]!
                      val = offset[1]
                      baseVal = offset[0]
                    } else {
                      val = y(d)
                      baseVal = yMin
                    }
                    const barStart = catPos + (mode === 'grouped' ? si * subBandW : 0)
                    const valStart = Math.min(valScale.map(val), valScale.map(baseVal))
                    const valLen = Math.abs(valScale.map(val) - valScale.map(baseVal))

                    if (isVertical) {
                      return (
                        <rect
                          key={`${s.id}-${di}`}
                          x={barStart}
                          y={valStart}
                          width={subBandW}
                          height={valLen}
                          fill={color}
                          rx={2}
                          data-series={s.id}
                        />
                      )
                    } else {
                      return (
                        <rect
                          key={`${s.id}-${di}`}
                          x={valStart}
                          y={barStart}
                          width={valLen}
                          height={subBandW}
                          fill={color}
                          rx={2}
                          data-series={s.id}
                        />
                      )
                    }
                  })
                })}
                {isVertical ? (
                  <>
                    <Axis
                      scale={catScale}
                      orientation="x"
                      length={innerW}
                      tickCount={xTicks}
                      transform={`translate(0,${innerH})`}
                    />
                    <Axis scale={valScale} orientation="y" length={innerH} tickCount={yTicks} />
                  </>
                ) : (
                  <>
                    <Axis
                      scale={valScale}
                      orientation="x"
                      length={innerW}
                      tickCount={xTicks}
                      transform={`translate(0,${innerH})`}
                    />
                    <Axis scale={catScale} orientation="y" length={innerH} tickCount={yTicks} />
                  </>
                )}
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
