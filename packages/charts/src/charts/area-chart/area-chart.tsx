'use client'
import { useSignal, useSignals } from '@cascivo/core'
import { ChartFrame } from '../../core/chart-frame'
import { DEFAULT_MARGINS, PLAIN_MARGINS } from '../../core/use-chart'
import { Axis } from '../../chrome/axis'
import { GridLines } from '../../chrome/grid-lines'
import { Legend } from '../../chrome/legend'
import { renderAnnotations, type Annotation } from '../../chrome/reference'
import { DataLabel, resolveLabels, type LabelOptions } from '../../chrome/data-label'
import { linearScale } from '../../engine/scale'
import { areaPath, linePath, stackSeries } from '../../engine/shape'
import type { Point } from '../../engine/shape'
import type { ChartPoint, TooltipModel } from '../../core/data-point'

export interface AreaChartSeries<Datum> {
  id: string
  label: string
  data: readonly Datum[]
  color?: string
}

export interface AreaChartProps<Datum = { x: number; y: number }> {
  series: readonly AreaChartSeries<Datum>[]
  x: (d: Datum) => number
  y: (d: Datum) => number
  title: string
  description?: string
  stacked?: boolean
  curve?: 'linear' | 'monotone'
  width?: number
  height?: number
  xTicks?: number
  yTicks?: number
  legend?: boolean
  tooltip?: boolean
  className?: string
  /** Render only the marks — no axes, grid lines, or legend. For micro/inline charts. */
  plain?: boolean
  /** Reference lines, shaded bands, and markers drawn over the plot (target/threshold annotations). */
  annotations?: readonly Annotation[]
  /** Print each point's value as a label above the top edge. */
  labels?: LabelOptions
}

const COLORS = Array.from({ length: 8 }, (_, i) => `var(--cascivo-chart-${i + 1})`)

export function AreaChart<Datum = { x: number; y: number }>({
  series,
  x,
  y,
  title,
  description,
  stacked = false,
  curve = 'monotone',
  width: fixedWidth,
  height,
  xTicks = 5,
  yTicks = 5,
  legend,
  tooltip,
  className,
  plain,
  annotations,
  labels,
}: AreaChartProps<Datum>) {
  useSignals()
  const hidden = useSignal(new Set<string>())
  const resolvedLabels = plain ? null : resolveLabels(labels)
  const margins = plain ? PLAIN_MARGINS : DEFAULT_MARGINS
  const resolvedHeight = height ?? (plain ? 48 : 300)
  const showLegend = plain ? false : (legend ?? series.length > 1)

  const allX = (series[0]?.data ?? []).map((d) => x(d))
  const allY = series.flatMap((s) => s.data.map((d) => y(d)))
  const hasData = allX.length > 0

  const xMin = hasData ? Math.min(...allX) : 0
  const xMax = hasData ? Math.max(...allX) : 1
  const yMin = stacked ? 0 : Math.min(0, ...allY)
  const yMax = stacked
    ? Math.max(
        ...(series[0]?.data ?? []).map((_, i) => series.reduce((sum, s) => sum + y(s.data[i]!), 0)),
      )
    : Math.max(...allY)

  const fallback = (
    <table>
      <caption>{title}</caption>
      <thead>
        <tr>
          <th>X</th>
          {series.map((s) => (
            <th key={s.id}>{s.label}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {(series[0]?.data ?? []).map((_, i) => (
          <tr key={i}>
            <td>{series[0] ? String(x(series[0].data[i]!)) : ''}</td>
            {series.map((s) => (
              <td key={s.id}>{s.data[i] != null ? y(s.data[i]!) : ''}</td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  )

  /** Build tooltip model using the chart's resolved pixel dimensions. */
  const buildTooltip = ({
    width: w,
    height: h,
  }: {
    width: number
    height: number
  }): TooltipModel | undefined => {
    if (tooltip === false || !hasData) return undefined

    const innerW = w - margins.left - margins.right
    const innerH = h - margins.top - margins.bottom
    const xScale = linearScale([xMin, xMax], [0, innerW])
    const yScale = linearScale([yMin, yMax], [innerH, 0])

    const points: ChartPoint[] = series.flatMap((s) => {
      if (hidden.value.has(s.id)) return []
      return s.data.map((d, i) => ({
        id: `${s.id}-${i}`,
        cx: margins.left + xScale.map(x(d)),
        cy: margins.top + yScale.map(y(d)),
        label: String(x(d)),
        value: y(d),
        seriesId: s.id,
      }))
    })

    return { points }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
      <ChartFrame
        title={title}
        description={description}
        width={fixedWidth}
        height={resolvedHeight}
        fallback={fallback}
        className={className}
        data-state={hasData ? undefined : 'empty'}
        plain={plain}
        tooltip={tooltip !== false && hasData ? buildTooltip : undefined}
      >
        {({ width, height: h }) => {
          const innerW = width - margins.left - margins.right
          const innerH = h - margins.top - margins.bottom
          const xScale = linearScale([xMin, xMax], [0, innerW])
          const yScale = linearScale([yMin, yMax], [innerH, 0])

          let stackedOffsets: [number, number][][] = []
          if (stacked) {
            const values = series.map((s) => s.data.map((d) => y(d)))
            stackedOffsets = stackSeries(values)
          }

          return (
            <g>
              <g transform={`translate(${margins.left},${margins.top})`}>
                {!plain && (
                  <GridLines scale={yScale} orientation="y" length={innerW} tickCount={yTicks} />
                )}
                {!plain && renderAnnotations(annotations, { xScale, yScale, innerW, innerH })}
                {series.map((s, si) => {
                  if (hidden.value.has(s.id)) return null
                  const color = s.color ?? COLORS[si % COLORS.length]!
                  let points: Point[]
                  let baseline: number
                  if (stacked && stackedOffsets[si]) {
                    const offsets = stackedOffsets[si]!
                    points = s.data.map((d, i) => [xScale.map(x(d)), yScale.map(offsets[i]![1])])
                    const basePoints = s.data.map(
                      (d, i) => [xScale.map(x(d)), yScale.map(offsets[i]![0])] as Point,
                    )
                    baseline = yScale.map(0)
                    // For stacked, draw area between y0 and y1
                    const topPath = linePath(points, curve)
                    const last = basePoints[basePoints.length - 1]!
                    const first = basePoints[0]!
                    // area = top line + close along base points (reversed)
                    const reversedBase = [...basePoints].reverse()
                    const basePath = reversedBase.map(([bx, by]) => `L${bx},${by}`).join('')
                    const d = `${topPath}L${last[0]},${last[1]}${basePath}L${first[0]},${first[1]}Z`
                    return (
                      <g key={s.id} data-series={s.id}>
                        <path d={d} fill={color} fillOpacity={0.25} stroke="none" />
                        <path
                          d={linePath(points, curve)}
                          fill="none"
                          stroke={color}
                          strokeWidth={2}
                        />
                        {resolvedLabels &&
                          points.map((p, i) => (
                            <DataLabel
                              key={i}
                              x={p[0]}
                              y={p[1] - 8}
                              text={resolvedLabels.format(y(s.data[i]!))}
                            />
                          ))}
                      </g>
                    )
                  } else {
                    points = s.data.map((d) => [xScale.map(x(d)), yScale.map(y(d))])
                    baseline = yScale.map(0)
                    return (
                      <g key={s.id} data-series={s.id}>
                        <path
                          d={areaPath(points, baseline, curve)}
                          fill={color}
                          fillOpacity={0.25}
                          stroke="none"
                        />
                        <path
                          d={linePath(points, curve)}
                          fill="none"
                          stroke={color}
                          strokeWidth={2}
                        />
                        {resolvedLabels &&
                          points.map((p, i) => (
                            <DataLabel
                              key={i}
                              x={p[0]}
                              y={p[1] - 8}
                              text={resolvedLabels.format(y(s.data[i]!))}
                            />
                          ))}
                      </g>
                    )
                  }
                })}
                {!plain && (
                  <>
                    <Axis
                      scale={xScale}
                      orientation="x"
                      length={innerW}
                      tickCount={xTicks}
                      transform={`translate(0,${innerH})`}
                    />
                    <Axis scale={yScale} orientation="y" length={innerH} tickCount={yTicks} />
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
