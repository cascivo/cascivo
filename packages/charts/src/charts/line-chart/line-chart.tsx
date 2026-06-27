'use client'
import { useSignal, useSignals } from '@cascivo/core'
import { ChartFrame } from '../../core/chart-frame'
import { DEFAULT_MARGINS, PLAIN_MARGINS } from '../../core/use-chart'
import { Axis } from '../../chrome/axis'
import { GridLines } from '../../chrome/grid-lines'
import { Legend } from '../../chrome/legend'
import { renderAnnotations, type Annotation } from '../../chrome/reference'
import { DataLabel, resolveLabels, type LabelOptions } from '../../chrome/data-label'
import { Brush } from '../../chrome/brush'
import { linearScale } from '../../engine/scale'
import { timeScale } from '../../engine/scale-time'
import { linePath, splitDefined } from '../../engine/shape'
import type { Point, Curve } from '../../engine/shape'
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
  curve?: Curve
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
  /** Bridge `null`/non-finite y gaps instead of breaking the line at them (default: break). */
  connectNulls?: boolean
  /** Fired when a point is clicked or activated (Enter/Space) — for drill-down. */
  onSelect?: (point: ChartPoint) => void
  /** Show a keyboard-operable Brush below the plot to subset (zoom) the series to a window. */
  brush?: boolean
}

const COLORS = Array.from({ length: 8 }, (_, i) => `var(--cascivo-chart-${i + 1})`)

export function LineChart<Datum = { x: number; y: number }>({
  series: rawSeries,
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
  connectNulls,
  onSelect,
  brush,
}: LineChartProps<Datum>) {
  useSignals()
  const hidden = useSignal(new Set<string>())
  const resolvedLabels = plain ? null : resolveLabels(labels)

  // Brush window — when enabled, the plot renders only the selected index range.
  const fullLen = rawSeries.reduce((m, s) => Math.max(m, s.data.length), 0)
  const win = useSignal<[number, number]>([0, Math.max(0, fullLen - 1)])
  const series =
    brush && fullLen > 0
      ? rawSeries.map((s) => ({ ...s, data: s.data.slice(win.value[0], win.value[1] + 1) }))
      : rawSeries

  const margins = plain ? PLAIN_MARGINS : DEFAULT_MARGINS
  const resolvedHeight = height ?? (plain ? 48 : 300)
  const showLegend = plain ? false : (legend ?? series.length > 1)

  const allX = series.flatMap((s) => s.data.map((d) => x(d)))
  // Drop non-finite y (gaps) so the domain isn't poisoned by NaN.
  const allY = series.flatMap((s) => s.data.map((d) => y(d))).filter((v) => Number.isFinite(v))
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
      return s.data.flatMap((d, i) => {
        const yv = y(d)
        if (!Number.isFinite(yv)) return [] // gap — no focusable point
        const xv = x(d)
        const xPos = usesDate
          ? (xScale as ReturnType<typeof timeScale>).map(xv as Date)
          : (xScale as ReturnType<typeof linearScale>).map(xv as number)
        const yPos = yScale.map(yv)
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
        onSelect={onSelect}
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
                  // null marks a gap (missing / non-finite y) so the line breaks there.
                  const rawPts: (Point | null)[] = s.data.map((d) => {
                    const yv = y(d)
                    if (!Number.isFinite(yv)) return null
                    const xv = x(d)
                    const xPos = usesDate
                      ? (xScale as ReturnType<typeof timeScale>).map(xv as Date)
                      : (xScale as ReturnType<typeof linearScale>).map(xv as number)
                    return [xPos, yScale.map(yv)] as Point
                  })
                  const runs = splitDefined(rawPts, connectNulls)
                  const color = s.color ?? COLORS[i % COLORS.length]!
                  return (
                    <g key={s.id}>
                      {runs.map((run, ri) => (
                        <path
                          key={ri}
                          d={linePath(run, curve)}
                          fill="none"
                          stroke={color}
                          strokeWidth={2}
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          data-series={s.id}
                        />
                      ))}
                      {resolvedLabels &&
                        s.data.map((d, di) => {
                          const p = rawPts[di]
                          if (!p) return null
                          return (
                            <DataLabel
                              key={di}
                              x={p[0]}
                              y={p[1] - 8}
                              text={resolvedLabels.format(y(d))}
                            />
                          )
                        })}
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
      {brush && fullLen > 1 && <Brush count={fullLen} window={win} label="Time range" />}
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
