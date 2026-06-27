'use client'
import { useSignal, useSignalEffect, useSignals } from '@cascivo/core'
import { ChartFrame } from '../../core/chart-frame'
import { DEFAULT_MARGINS, PLAIN_MARGINS } from '../../core/use-chart'
import { getSyncGroup, releaseSyncGroup, type SyncGroup } from '../../core/sync'
import { Axis } from '../../chrome/axis'
import { GridLines } from '../../chrome/grid-lines'
import { Legend } from '../../chrome/legend'
import { renderAnnotations, type Annotation } from '../../chrome/reference'
import { DataLabel, resolveLabels, type LabelOptions } from '../../chrome/data-label'
import { ChartDefs, fillFor, type FillKind, type PatternKind } from '../../chrome/defs'
import { Brush } from '../../chrome/brush'
import { DataZoom } from '../../chrome/data-zoom'
import { decimate as decimatePoints, type DecimateMethod, type Pt } from '../../engine/decimate'
import { useId, useRef } from 'react'
import { linearScale } from '../../engine/scale'
import { areaPath, linePath, stackSeries } from '../../engine/shape'
import type { Point, Curve } from '../../engine/shape'
import type { ChartPoint, TooltipModel } from '../../core/data-point'

export interface AreaDecimateOptions {
  method?: DecimateMethod
  threshold?: number
}

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
  curve?: Curve
  /** Area fill style: solid (default), a top→bottom gradient, or a pattern. */
  fill?: FillKind
  /** Pattern motif when `fill="pattern"`. */
  patternKind?: PatternKind
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
  /** Fired when a point is clicked or activated (Enter/Space) — for drill-down. */
  onSelect?: (point: ChartPoint) => void
  /** Show a keyboard-operable Brush below the plot to subset the series to a window. */
  brush?: boolean
  /** Show a DataZoom slider below the plot — a Brush whose body also pans the window. */
  dataZoom?: boolean
  /** Enable in-plot wheel/drag/keyboard zoom-pan (`+`/`-`/`0`) over the series index window. */
  zoom?: boolean
  /** Connect this chart to others sharing the same id — they mirror zoom window + hovered x. */
  syncId?: string
  /** Tooltip trigger: `item` (default, nearest point) or `axis` (crosshair + all series at the hovered x). */
  tooltipMode?: 'item' | 'axis'
  /** Downsample dense (non-stacked) series before drawing (LTTB/min-max). The fallback table keeps full data. */
  decimate?: boolean | AreaDecimateOptions
}

const COLORS = Array.from({ length: 8 }, (_, i) => `var(--cascivo-chart-${i + 1})`)

export function AreaChart<Datum = { x: number; y: number }>({
  series: rawSeries,
  x,
  y,
  title,
  description,
  stacked = false,
  curve = 'monotone',
  fill = 'solid',
  patternKind,
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
  onSelect,
  brush,
  dataZoom,
  zoom,
  syncId,
  tooltipMode,
  decimate,
}: AreaChartProps<Datum>) {
  useSignals()
  const defsId = useId()
  const hidden = useSignal(new Set<string>())
  const resolvedLabels = plain ? null : resolveLabels(labels)
  const decConf =
    decimate === true
      ? { method: 'lttb' as DecimateMethod, threshold: 1000 }
      : decimate
        ? { method: decimate.method ?? 'lttb', threshold: decimate.threshold ?? 1000 }
        : null

  // Index window — when any zoom affordance is on, the plot renders only this range.
  const fullLen = rawSeries.reduce((m, s) => Math.max(m, s.data.length), 0)
  const windowed = (brush || dataZoom || zoom || syncId !== undefined) && fullLen > 0
  const win = useSignal<[number, number]>([0, Math.max(0, fullLen - 1)])

  // Connect: mirror this chart's window to/from the shared sync group (no feedback loop).
  const syncRef = useRef<SyncGroup | null>(null)
  if (syncId && !syncRef.current) syncRef.current = getSyncGroup(syncId)
  useSignalEffect(() => () => {
    if (syncId) releaseSyncGroup(syncId)
  })
  useSignalEffect(() => {
    const g = syncRef.current
    if (!g) return
    const shared = g.window.value
    const local = win.peek()
    if (shared && (shared[0] !== local[0] || shared[1] !== local[1])) win.value = shared
  })
  useSignalEffect(() => {
    const g = syncRef.current
    if (!g) return
    const local = win.value
    const shared = g.window.peek()
    if (!shared || shared[0] !== local[0] || shared[1] !== local[1]) g.window.value = local
  })

  const series = windowed
    ? rawSeries.map((s) => ({ ...s, data: s.data.slice(win.value[0], win.value[1] + 1) }))
    : rawSeries
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

    // Axis mode — one focusable point per x index carrying every series as segments.
    if (tooltipMode === 'axis') {
      const len = series.reduce((m, s) => Math.max(m, s.data.length), 0)
      const axisPoints: ChartPoint[] = []
      for (let i = 0; i < len; i++) {
        const segments: { label: string; value: number; color?: string }[] = []
        let cyTop = Infinity
        let labelX = ''
        let cx = margins.left
        series.forEach((s, si) => {
          if (hidden.value.has(s.id)) return
          const d = s.data[i]
          if (d === undefined) return
          const yv = y(d)
          if (!Number.isFinite(yv)) return
          cx = margins.left + xScale.map(x(d))
          cyTop = Math.min(cyTop, yScale.map(yv))
          labelX = String(x(d))
          segments.push({
            label: s.label,
            value: yv,
            color: s.color ?? COLORS[si % COLORS.length]!,
          })
        })
        if (segments.length === 0) continue
        axisPoints.push({
          id: `x-${i}`,
          cx,
          cy: margins.top + (cyTop === Infinity ? 0 : cyTop),
          label: labelX,
          value: labelX,
          segments,
        })
      }
      const format = (p: ChartPoint): string =>
        `${p.label}: ${(p.segments ?? []).map((s) => `${s.label} ${s.value}`).join(', ')}`
      return { points: axisPoints, mode: 'axis', format }
    }

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
        onSelect={onSelect}
        zoom={zoom && fullLen > 1 ? { window: win, count: fullLen } : undefined}
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
              {fill !== 'solid' && (
                <ChartDefs
                  prefix={defsId}
                  fill={fill}
                  patternKind={patternKind}
                  series={series.map((s, si) => ({
                    id: s.id,
                    color: s.color ?? COLORS[si % COLORS.length]!,
                  }))}
                />
              )}
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
                        <path
                          d={d}
                          fill={fillFor(defsId, s.id, fill, color)}
                          fillOpacity={fill === 'solid' ? 0.25 : 1}
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
                  } else {
                    points = s.data.map((d) => [xScale.map(x(d)), yScale.map(y(d))])
                    baseline = yScale.map(0)
                    // Dense, non-stacked series: downsample for a fast, crisp path.
                    if (decConf && points.length > decConf.threshold) {
                      const dec = decimatePoints(points as Pt[], decConf.threshold, decConf.method)
                      const decPts = dec.map((p) => [p[0], p[1]] as Point)
                      return (
                        <g key={s.id} data-series={s.id}>
                          <path
                            d={areaPath(decPts, baseline, curve)}
                            fill={fillFor(defsId, s.id, fill, color)}
                            fillOpacity={fill === 'solid' ? 0.25 : 1}
                            stroke="none"
                          />
                          <path
                            d={linePath(decPts, curve)}
                            fill="none"
                            stroke={color}
                            strokeWidth={2}
                          />
                        </g>
                      )
                    }
                    return (
                      <g key={s.id} data-series={s.id}>
                        <path
                          d={areaPath(points, baseline, curve)}
                          fill={fillFor(defsId, s.id, fill, color)}
                          fillOpacity={fill === 'solid' ? 0.25 : 1}
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
      {brush && !dataZoom && fullLen > 1 && <Brush count={fullLen} window={win} label="Range" />}
      {dataZoom && fullLen > 1 && <DataZoom count={fullLen} window={win} label="Range" />}
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
