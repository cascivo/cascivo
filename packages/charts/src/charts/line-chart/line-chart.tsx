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
import { timeScale } from '../../engine/scale-time'
import { linePath } from '../../engine/shape'
import type { Point } from '../../engine/shape'
import type { ChartPoint, TooltipModel } from '../../core/data-point'

export interface LineChartSeries<Datum> {
  id: string
  label: string
  data: readonly Datum[]
  color?: string
}

export interface LineChartProps<Datum = { x: number; y: number }> {
  series: readonly LineChartSeries<Datum>[]
  x: (d: Datum) => number | Date
  y: (d: Datum) => number
  title: string
  description?: string
  curve?: 'linear' | 'monotone'
  width?: number
  height?: number
  xTicks?: number
  yTicks?: number
  legend?: boolean
  tooltip?: boolean
  formatTooltip?: (datum: Datum, series: LineChartSeries<Datum>) => string
  className?: string
  /** Render only the marks — no axes, grid lines, or legend. For micro/inline charts. */
  plain?: boolean
  /** Reference lines, shaded bands, and markers drawn over the plot (target/threshold annotations). */
  annotations?: readonly Annotation[]
  /** Print each point's value as a label above the mark. */
  labels?: LabelOptions
}

const COLORS = Array.from({ length: 8 }, (_, i) => `var(--cascivo-chart-${i + 1})`)

export function LineChart<Datum = { x: number; y: number }>({
  series,
  x,
  y,
  title,
  description,
  curve = 'monotone',
  width: fixedWidth,
  height,
  xTicks = 5,
  yTicks = 5,
  legend,
  tooltip,
  formatTooltip,
  className,
  plain,
  annotations,
  labels,
}: LineChartProps<Datum>) {
  useSignals()
  const hidden = useSignal(new Set<string>())
  const resolvedLabels = plain ? null : resolveLabels(labels)

  const margins = plain ? PLAIN_MARGINS : DEFAULT_MARGINS
  const resolvedHeight = height ?? (plain ? 48 : 300)
  const showLegend = plain ? false : (legend ?? series.length > 1)

  const allX = series.flatMap((s) => s.data.map((d) => x(d)))
  const allY = series.flatMap((s) => s.data.map((d) => y(d)))
  const hasData = allX.length > 0

  const usesDate = hasData && allX[0] instanceof Date

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
            <td>{String(series[0] ? x(series[0].data[i]!) : '')}</td>
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

    const xMin = usesDate
      ? Math.min(...(allX as Date[]).map((d) => d.getTime()))
      : Math.min(...(allX as number[]))
    const xMax = usesDate
      ? Math.max(...(allX as Date[]).map((d) => d.getTime()))
      : Math.max(...(allX as number[]))
    const yMin = Math.min(0, ...allY)
    const yMax = Math.max(...allY)

    const xScale = usesDate
      ? timeScale([new Date(xMin), new Date(xMax)], [0, innerW])
      : linearScale([xMin, xMax], [0, innerW])
    const yScale = linearScale([yMin, yMax], [innerH, 0])

    const points: ChartPoint[] = series.flatMap((s) => {
      if (hidden.value.has(s.id)) return []
      return s.data.map((d, i) => {
        const xv = x(d)
        const xPos = usesDate
          ? (xScale as ReturnType<typeof timeScale>).map(xv as Date)
          : (xScale as ReturnType<typeof linearScale>).map(xv as number)
        const yPos = yScale.map(y(d))
        const label = xv instanceof Date ? xv.toLocaleDateString() : String(xv)
        return {
          id: `${s.id}-${i}`,
          cx: margins.left + xPos,
          cy: margins.top + yPos,
          label,
          value: y(d),
          seriesId: s.id,
        } satisfies ChartPoint
      })
    })

    if (!formatTooltip) return { points }

    const format = (p: ChartPoint): string => {
      const s = series.find((sv) => sv.id === p.seriesId)
      const dIdx = parseInt(p.id.split('-').pop() ?? '0', 10)
      if (s && s.data[dIdx] !== undefined) {
        return formatTooltip(s.data[dIdx]!, s)
      }
      return `${p.label}: ${p.value}`
    }

    return { points, format }
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
        {({ width: w, height: h }) => {
          const innerW = w - margins.left - margins.right
          const innerH = h - margins.top - margins.bottom

          const xMin = usesDate
            ? Math.min(...(allX as Date[]).map((d) => d.getTime()))
            : Math.min(...(allX as number[]))
          const xMax = usesDate
            ? Math.max(...(allX as Date[]).map((d) => d.getTime()))
            : Math.max(...(allX as number[]))
          const yMin = Math.min(0, ...allY)
          const yMax = Math.max(...allY)

          const xScale = usesDate
            ? timeScale([new Date(xMin), new Date(xMax)], [0, innerW])
            : linearScale([xMin, xMax], [0, innerW])
          const yScale = linearScale([yMin, yMax], [innerH, 0])

          return (
            <g>
              <g transform={`translate(${margins.left},${margins.top})`}>
                {!plain && (
                  <GridLines scale={yScale} orientation="y" length={innerW} tickCount={yTicks} />
                )}
                {!plain &&
                  renderAnnotations(annotations, {
                    xScale: xScale as { map: (v: never) => number | undefined },
                    yScale,
                    innerW,
                    innerH,
                  })}
                {series.map((s, i) => {
                  if (hidden.value.has(s.id)) return null
                  const pts: Point[] = s.data.map((d) => {
                    const xv = x(d)
                    const xPos = usesDate
                      ? (xScale as ReturnType<typeof timeScale>).map(xv as Date)
                      : (xScale as ReturnType<typeof linearScale>).map(xv as number)
                    return [xPos, yScale.map(y(d))]
                  })
                  const color = s.color ?? COLORS[i % COLORS.length]!
                  return (
                    <g key={s.id}>
                      <path
                        d={linePath(pts, curve)}
                        fill="none"
                        stroke={color}
                        strokeWidth={2}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        data-series={s.id}
                      />
                      {resolvedLabels &&
                        s.data.map((d, di) => (
                          <DataLabel
                            key={di}
                            x={pts[di]![0]}
                            y={pts[di]![1] - 8}
                            text={resolvedLabels.format(y(d))}
                          />
                        ))}
                    </g>
                  )
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
