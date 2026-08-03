'use client'
import { useSignal, useSignalEffect, useSignals } from '@cascivo/core'
import { ChartFrame } from '../../core/chart-frame'
import { warnNonFinite, warnScaleMismatch } from '../../core/dev-warn'
import {
  DEFAULT_MARGINS,
  leftMarginForLabels,
  PLAIN_MARGINS,
  rightMarginForLabels,
  AXIS_CHAR_PX,
} from '../../core/use-chart'
import { getSyncGroup, releaseSyncGroup, type SyncGroup } from '../../core/sync'
import { Axis } from '../../chrome/axis'
import { GridLines } from '../../chrome/grid-lines'
import { Legend } from '../../chrome/legend'
import { renderAnnotations, type Annotation } from '../../chrome/reference'
import { DataLabel, resolveLabels, type LabelOptions } from '../../chrome/data-label'
import { ChartDefs, fillFor, type FillKind, type PatternKind } from '../../chrome/defs'
import { Brush } from '../../chrome/brush'
import { DataZoom } from '../../chrome/data-zoom'
import type { ToolboxOptions } from '../../chrome/toolbox'
import { decimate as decimatePoints, type DecimateMethod, type Pt } from '../../engine/decimate'
import { useId, useRef } from 'react'
import { linearScale } from '../../engine/scale'
import { timeScale } from '../../engine/scale-time'
import { areaPath, linePath, stackSeries } from '../../engine/shape'
import type { Point, Curve } from '../../engine/shape'
import type { ChartPoint, TooltipModel } from '../../core/data-point'

// Area body opacity for solid fills. Themes tune it via --cascivo-chart-fill-opacity
// (the dark theme raises it, since a low-opacity fill over the dark surface reads as
// a muddy neutral). Static 0.25 fallback keeps non-supporting paths correct.
const SOLID_FILL_STYLE = { fillOpacity: 'var(--cascivo-chart-fill-opacity, 0.25)' }

/**
 * Fill opacity for a solid area. A single area reads best at the theme's full fill
 * opacity, but overlapping areas at that opacity hide each other completely: an adopter
 * reported a plot that was solid grey with one outline while the legend named two series
 * in two colours nobody could see. Overlapping fills drop to a translucency where each
 * series stays identifiable, and the stroke (drawn at full opacity) carries the colour.
 *
 * Stacked areas never overlap, so they keep the full opacity.
 */
function solidFillStyle(seriesCount: number, stacked: boolean): { fillOpacity: string } {
  if (stacked || seriesCount <= 1) return SOLID_FILL_STYLE
  return { fillOpacity: 'var(--cascivo-chart-fill-opacity-overlap, 0.12)' }
}

export interface AreaDecimateOptions {
  method?: DecimateMethod
  threshold?: number
}

export interface AreaChartSeries<Datum> {
  id: string
  label: string
  data: readonly Datum[]
  /**
   * Series colour. **Omit it** — the Nth series automatically takes `--cascivo-chart-N`,
   * eight distinct hues per theme in both light and dark, so a multi-series chart
   * differentiates itself with no configuration. Set this only to override the position,
   * e.g. to keep "errors" red wherever it lands in the array.
   */
  color?: string
  /** Which y-axis this series is measured against (ignored when `stacked`). Default 'left'. */
  axis?: 'left' | 'right'
  /**
   * Per-series Y accessor. Overrides the chart-level `y` for this series only —
   * use it to plot two series from one shared `data` row against different fields
   * (e.g. `y: (d) => d.requests` on one series, `y: (d) => d.errors` on another).
   * Defaults to the chart-level `y`.
   */
  y?: (d: Datum) => number
}

export interface AreaChartProps<Datum = { x: number; y: number }> {
  series: readonly AreaChartSeries<Datum>[]
  /**
   * X-value accessor. Return a `number` for a numeric axis, or a `Date` for a
   * time axis — when the values are Dates the chart uses a time scale and formats
   * ticks as dates (parity with `LineChart`). One x-domain per chart.
   */
  x: (d: Datum) => number | Date
  /**
   * Y-value accessor, applied to **every** series' data unless a series provides
   * its own `y`. There is one x-domain per chart, so `x` is chart-level only; to
   * plot multiple fields from one row, give each series its own `y`.
   */
  y: (d: Datum) => number
  /**
   * ⚠ **Not rendered as a visible heading.** This becomes the chart's accessible name
   * (the SVG `<caption>` / `aria-label`), which is why it is required — a chart with no
   * accessible name is unusable with a screen reader.
   *
   * For a visible heading, put a `CardTitle`/`Heading` above the chart. The prop name
   * promises a heading and an adopter wrote one, saw nothing, and ended up with a
   * redundant `CardTitle` on every chart anyway.
   *
   * It is NOT renamed to `ariaLabel` (the catalog's name for an invisible accessible name)
   * because an alias would have to make both optional, which drops the compile-time
   * guarantee that every chart has an accessible name. The requirement is worth more than
   * the naming consistency; this warning is the compensation.
   */
  title: string
  description?: string
  stacked?: boolean
  /**
   * Line/area interpolation curve.
   *
   * @defaultValue `monotone`
   * @see the component manifest
   */
  curve?: Curve
  /**
   * Area fill style — solid, a top→bottom gradient, or a pattern.
   *
   * @defaultValue `solid`
   * @see the component manifest
   */
  fill?: FillKind
  /** Pattern motif when `fill="pattern"`. */
  patternKind?: PatternKind
  /**
   * Fixed SVG width in px. ⚠ **Omit for a responsive chart** — the chart fills and tracks
   * its container via a ResizeObserver; there is no correct pixel number in a responsive
   * grid. A fixed width is clamped to the container (max-inline-size: 100%) so it can never
   * overflow its card, but it also stops the chart growing. `useChartSize` is NOT needed for
   * this — charts call it internally.
   * @see the component manifest
   */
  width?: number
  height?: number
  /**
   * Approximate number of ticks on the x-axis.
   *
   * @defaultValue `5`
   * @see the component manifest
   */
  xTicks?: number
  /**
   * Approximate number of ticks on the y-axis.
   *
   * @defaultValue `5`
   * @see the component manifest
   */
  yTicks?: number
  legend?: boolean
  tooltip?: boolean
  className?: string
  /**
   * Marks only — no axes, grid lines, or legend. For micro/inline charts.
   *
   * @defaultValue `false`
   * @see the component manifest
   */
  plain?: boolean
  /** Reference lines, shaded bands, and markers drawn over the plot (target/threshold annotations). */
  annotations?: readonly Annotation[]
  /** Print each point's value as a label above the top edge. */
  labels?: LabelOptions
  /** Fired when a point is clicked or activated (Enter/Space) — for drill-down. */
  onSelect?: (point: ChartPoint) => void
  /**
   * Show a keyboard-operable Brush below the plot to subset the series to a window.
   *
   * @defaultValue `false`
   * @see the component manifest
   */
  brush?: boolean
  /**
   * Show a DataZoom slider below the plot — a Brush whose body also pans the window.
   *
   * @defaultValue `false`
   * @see the component manifest
   */
  dataZoom?: boolean
  /**
   * Enable in-plot wheel/drag/keyboard zoom-pan (+/-/0) over the series index window, with a
   * reset control and re-ticked axes.
   *
   * @defaultValue `false`
   * @see the component manifest
   */
  zoom?: boolean
  /** Connect this chart to others sharing the same id — they mirror zoom window + hovered x. */
  syncId?: string
  /**
   * Tooltip trigger — item (nearest point) or axis (a crosshair + a shared tooltip listing
   * every series at the hovered x).
   *
   * @defaultValue `item`
   * @see the component manifest
   */
  tooltipMode?: 'item' | 'axis'
  /** Add a right-hand y-axis for series with `axis: 'right'` (non-stacked only). */
  secondAxis?: { label?: string; format?: (value: number) => string }
  /** Downsample dense (non-stacked) series before drawing (LTTB/min-max). The fallback table keeps full data. */
  decimate?: boolean | AreaDecimateOptions
  /** Render a toolbox (PNG/SVG export, data-view toggle, restore). `true` enables all tools. */
  toolbox?: boolean | ToolboxOptions
  /**
   * Format each X-axis tick label. Receives the datum's raw `x` value — a number, a string,
   * or a `Date`, whichever the series carries.
   *
   * Without it a numeric x renders raw: a `Date.now()`-scale value (the natural shape for a
   * time series) renders as `1,785,217,000,000`. Passing `Date` objects switches the axis to
   * a time scale, but that format is fixed, so every bucket narrower than a day collapses to
   * the same label. Threads through `Axis`'s own `format` (2026-07-28 report C16).
   */
  format?: (value: number | string | Date) => string
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
  secondAxis,
  decimate,
  toolbox,
  format: xFormat,
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
  // A right y-axis is added only when a (non-stacked) series opts in; otherwise
  // the layout and scales are byte-identical to the single-axis default.
  const hasRight = !plain && !stacked && series.some((s) => s.axis === 'right')
  const resolvedHeight = height ?? (plain ? 48 : 300)
  const showLegend = plain ? false : (legend ?? series.length > 1)
  // Overlapping solid areas must not hide each other — see solidFillStyle.
  const fillStyle = solidFillStyle(series.length, stacked)

  // Per-series Y accessor: a series may override the chart-level `y` (e.g. to plot
  // a different field from a shared data row). Falls back to the chart-level `y`.
  const yFor = (s: AreaChartSeries<Datum>) => s.y ?? y

  const allX = (series[0]?.data ?? []).map((d) => x(d))
  const leftYvals = (hasRight ? series.filter((s) => s.axis !== 'right') : series).flatMap((s) =>
    s.data.map((d) => yFor(s)(d)),
  )
  const rightYvals = hasRight
    ? series.filter((s) => s.axis === 'right').flatMap((s) => s.data.map((d) => yFor(s)(d)))
    : []
  // Two series of very different magnitude on one axis: the smaller renders as a flat
  // line at the baseline while the legend still names both — a plot that contradicts its
  // own legend, which is worse than an error because it looks like it worked.
  if (!hasRight && !stacked && series.length > 1) {
    warnScaleMismatch(
      'AreaChart',
      series.map((s) => ({
        label: s.label,
        max: Math.max(0, ...s.data.map((d) => yFor(s)(d)).filter((v) => Number.isFinite(v))),
      })),
    )
  }
  warnNonFinite('AreaChart', () => [...leftYvals, ...rightYvals])
  const hasData = allX.length > 0

  // Time axis when the x accessor returns Dates (parity with LineChart). Domain is
  // computed on epoch ms either way; the scale factory picks time vs linear.
  const usesDate = hasData && allX[0] instanceof Date
  const xNums = allX.map((v) => (v instanceof Date ? v.getTime() : v))
  const xMin = hasData ? Math.min(...xNums) : 0
  const xMax = hasData ? Math.max(...xNums) : 1
  const makeXScale = (innerW: number) =>
    usesDate
      ? timeScale([new Date(xMin), new Date(xMax)], [0, innerW])
      : linearScale([xMin, xMax], [0, innerW])
  const mapX = (xScale: ReturnType<typeof makeXScale>, d: Datum): number =>
    usesDate
      ? (xScale as ReturnType<typeof timeScale>).map(x(d) as Date)
      : (xScale as ReturnType<typeof linearScale>).map(x(d) as number)
  const labelOf = (d: Datum): string => {
    const xv = x(d)
    return xv instanceof Date ? xv.toLocaleDateString() : String(xv)
  }
  const yMin = stacked ? 0 : Math.min(0, ...leftYvals)
  const yMax = stacked
    ? Math.max(
        ...(series[0]?.data ?? []).map((_, i) =>
          series.reduce((sum, s) => sum + yFor(s)(s.data[i]!), 0),
        ),
      )
    : Math.max(...leftYvals)
  const yMinR = hasRight ? Math.min(0, ...rightYvals) : yMin
  const yMaxR = hasRight ? Math.max(...rightYvals) : yMax

  // Size the left margin to the widest left y-axis tick label so wide values
  // (e.g. "40,000") aren't clipped at the SVG's origin.
  const leftAxisLabels = linearScale([yMin, yMax], [0, 1])
    .ticks(yTicks)
    .map((v) => v.toLocaleString())
  // A right axis renders its labels OUTSIDE the plot, and the final bottom label is
  // centred on the plot's right edge so half of it overhangs ("7/26/2026" → "7/26/202").
  // Both need real room reserved; the fixed 60px used before covered neither reliably.
  const rightAxisLabels = hasRight
    ? linearScale([yMinR, yMaxR], [0, 1])
        .ticks(yTicks)
        .map((v) => (secondAxis?.format ? secondAxis.format(v) : v.toLocaleString()))
    : []
  const bottomAxisLabels = usesDate
    ? timeScale([new Date(xMin), new Date(xMax)], [0, 1])
        .ticks(xTicks)
        .map((d) => d.toLocaleDateString())
    : linearScale([xMin, xMax], [0, 1])
        .ticks(xTicks)
        .map((v) => v.toLocaleString())
  const margins = plain
    ? PLAIN_MARGINS
    : {
        ...DEFAULT_MARGINS,
        left: leftMarginForLabels(leftAxisLabels, plain),
        right: rightMarginForLabels({
          rightAxisLabels,
          bottomAxisLabels,
          rightAxisTitle: secondAxis?.label !== undefined && secondAxis.label !== '',
          plain,
        }),
      }

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
            <td>{series[0] ? labelOf(series[0].data[i]!) : ''}</td>
            {series.map((s) => (
              <td key={s.id}>{s.data[i] != null ? yFor(s)(s.data[i]!) : ''}</td>
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
    const xScale = makeXScale(innerW)
    const yScale = linearScale([yMin, yMax], [innerH, 0])
    const yScaleRight = hasRight ? linearScale([yMinR, yMaxR], [innerH, 0]) : yScale
    const yOf = (s: AreaChartSeries<Datum>) => (s.axis === 'right' ? yScaleRight : yScale)

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
          const yv = yFor(s)(d)
          if (!Number.isFinite(yv)) return
          cx = margins.left + mapX(xScale, d)
          cyTop = Math.min(cyTop, yOf(s).map(yv))
          labelX = labelOf(d)
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
        cx: margins.left + mapX(xScale, d),
        cy: margins.top + yOf(s).map(yFor(s)(d)),
        label: labelOf(d),
        value: yFor(s)(d),
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
        toolbox={toolbox}
        onRestore={
          windowed
            ? () => {
                win.value = [0, Math.max(0, fullLen - 1)]
              }
            : undefined
        }
      >
        {({ width, height: h }) => {
          const innerW = width - margins.left - margins.right
          const innerH = h - margins.top - margins.bottom
          const xScale = makeXScale(innerW)
          const yScale = linearScale([yMin, yMax], [innerH, 0])
          const yScaleRight = hasRight ? linearScale([yMinR, yMaxR], [innerH, 0]) : yScale

          let stackedOffsets: [number, number][][] = []
          if (stacked) {
            const values = series.map((s) => s.data.map((d) => yFor(s)(d)))
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
                    points = s.data.map((d, i) => [mapX(xScale, d), yScale.map(offsets[i]![1])])
                    const basePoints = s.data.map(
                      (d, i) => [mapX(xScale, d), yScale.map(offsets[i]![0])] as Point,
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
                          style={fill === 'solid' ? fillStyle : undefined}
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
                              text={resolvedLabels.format(yFor(s)(s.data[i]!))}
                            />
                          ))}
                      </g>
                    )
                  } else {
                    const ys = s.axis === 'right' ? yScaleRight : yScale
                    points = s.data.map((d) => [mapX(xScale, d), ys.map(yFor(s)(d))])
                    baseline = ys.map(0)
                    // Dense, non-stacked series: downsample for a fast, crisp path.
                    if (decConf && points.length > decConf.threshold) {
                      const dec = decimatePoints(points as Pt[], decConf.threshold, decConf.method)
                      const decPts = dec.map((p) => [p[0], p[1]] as Point)
                      return (
                        <g key={s.id} data-series={s.id}>
                          <path
                            d={areaPath(decPts, baseline, curve)}
                            fill={fillFor(defsId, s.id, fill, color)}
                            style={fill === 'solid' ? fillStyle : undefined}
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
                          style={fill === 'solid' ? fillStyle : undefined}
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
                              text={resolvedLabels.format(yFor(s)(s.data[i]!))}
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
                      {...(xFormat ? { format: xFormat } : {})}
                    />
                    <Axis scale={yScale} orientation="y" length={innerH} tickCount={yTicks} />
                    {hasRight && (
                      <Axis
                        scale={yScaleRight}
                        orientation="y-right"
                        length={innerH}
                        tickCount={yTicks}
                        transform={`translate(${innerW},0)`}
                        {...(secondAxis?.format
                          ? { format: (v: number | string | Date) => secondAxis.format!(Number(v)) }
                          : {})}
                        {...(secondAxis?.label !== undefined && secondAxis.label !== ''
                          ? {
                              title: secondAxis.label,
                              // Clear the widest tick label: they start 8px out from the
                              // axis line and run outward.
                              titleOffset:
                                8 +
                                Math.ceil(
                                  rightAxisLabels.reduce((m, l) => Math.max(m, l.length), 0) *
                                    AXIS_CHAR_PX,
                                ) +
                                10,
                            }
                          : {})}
                      />
                    )}
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
