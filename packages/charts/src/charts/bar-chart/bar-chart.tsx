'use client'
import { useSignal, useSignals } from '@cascivo/core'
import { ChartFrame } from '../../core/chart-frame'
import {
  autoLabelStride,
  DEFAULT_MARGINS,
  leftMarginForLabels,
  rightMarginForLabels,
  PLAIN_MARGINS,
} from '../../core/use-chart'
import { Axis } from '../../chrome/axis'
import { GridLines } from '../../chrome/grid-lines'
import { Legend } from '../../chrome/legend'
import { renderAnnotations, type Annotation } from '../../chrome/reference'
import { DataLabel, resolveLabels, type LabelOptions } from '../../chrome/data-label'
import { ChartDefs, fillFor, type FillKind, type PatternKind } from '../../chrome/defs'
import { useId } from 'react'
import { linearScale, bandScale } from '../../engine/scale'
import { stackSeries } from '../../engine/shape'
import type { ChartPoint, TooltipModel } from '../../core/data-point'

/**
 * Resolve a series' `color` for one datum. One helper for every call site so the palette
 * fallback (`COLORS[i % COLORS.length]`) stays identical whether the color is a string, a
 * function, or absent.
 */
function resolveColor<Datum>(
  color: string | ((datum: Datum, index: number) => string) | undefined,
  datum: Datum | undefined,
  index: number,
  fallback: string,
): string {
  if (typeof color === 'function') {
    // Legend swatches and tooltips are series-wide, so they pass the first datum: a
    // per-datum palette has no single "series color", and the first bar's is the least
    // surprising stand-in. The bars themselves always pass their own datum.
    return datum === undefined ? fallback : color(datum, index)
  }
  return color ?? fallback
}

export interface BarChartSeries<Datum> {
  id: string
  label: string
  data: readonly Datum[]
  /**
   * Bar color. A string colors the whole series; a function colors each bar from its own
   * datum.
   *
   * The per-datum form exists for the common single-series categorical chart whose
   * categories each carry meaning — incidents by severity, where SEV1 should read as
   * danger and SEV4 as neutral regardless of which bar is tallest. Before it, the only
   * route was one single-point series per category with `mode="grouped"`, which renders
   * *wrong*: the bars overlap and only the first series' category label survives
   * (2026-07-28 report C18).
   *
   * ```tsx
   * series={[{ id: 'count', label: 'Incidents', data, color: (d) => SEVERITY_COLOR[d.x] }]}
   * ```
   *
   * Each bar is also stamped with `data-x`, so CSS can target one category directly.
   */
  color?: string | ((datum: Datum, index: number) => string)
  /**
   * Per-series Y accessor. Overrides the chart-level `y` for this series only —
   * use it to plot two series from one shared `data` row against different fields
   * (e.g. `y: (d) => d.requests` on one series, `y: (d) => d.errors` on another).
   * Defaults to the chart-level `y`.
   */
  y?: (d: Datum) => number
}

export interface BarChartProps<Datum = { x: string; y: number }> {
  series: readonly BarChartSeries<Datum>[]
  x: (d: Datum) => string
  /**
   * Y-value accessor, applied to **every** series' data unless a series provides
   * its own `y`. There is one category (x) domain per chart, so `x` is chart-level
   * only; to plot multiple fields from one row, give each series its own `y`.
   */
  y: (d: Datum) => number
  title: string
  description?: string
  /**
   * Layout orientation of the component.
   *
   * @defaultValue `vertical`
   * @see the component manifest
   */
  orientation?: 'vertical' | 'horizontal'
  mode?: 'grouped' | 'stacked' | 'percent'
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
   * ⚠ **Follows SCREEN position, so its meaning swaps with `orientation`.** On a vertical
   * chart the x-axis is the category axis; on a horizontal one it is the VALUE axis. Prefer
   * {@link BarChartProps.valueAxisTicks} / {@link BarChartProps.categoryAxisTicks}, which
   * name the axis by role and never swap.
   *
   * @defaultValue `5`
   * @deprecated Use `valueAxisTicks` / `categoryAxisTicks`.
   */
  xTicks?: number
  /**
   * Approximate number of ticks on the y-axis.
   *
   * ⚠ **Follows SCREEN position, so its meaning swaps with `orientation`** — see
   * {@link BarChartProps.xTicks}.
   *
   * @defaultValue `5`
   * @deprecated Use `valueAxisTicks` / `categoryAxisTicks`.
   */
  yTicks?: number
  /**
   * Approximate number of ticks on the **value** axis, whichever way the chart is turned.
   *
   * This is the prop you want. `xTicks`/`yTicks` are named for where the axis is *drawn*,
   * so on `orientation="horizontal"` the value axis moves from screen-y to screen-x and the
   * controlling prop moves with it — `yTicks={1}` silently does nothing while `xTicks={1}`
   * works. Meanwhile `xLabelEvery` does NOT swap: it always strides the category axis. Two
   * conventions in one component, with nothing in the types to say so (2026-07-28 report
   * C17b). Wins over `xTicks`/`yTicks` when both are given.
   *
   * @defaultValue `5`
   */
  valueAxisTicks?: number
  /**
   * Approximate number of ticks on the CATEGORY axis, on both orientations. Role-named twin
   * of valueAxisTicks.
   *
   * @defaultValue `5`
   * @see the component manifest
   */
  categoryAxisTicks?: number
  /**
   * Show every Nth category label (and always the last) to thin a crowded axis.
   *
   * Always strides the **category** axis (the `x` field of each datum), on both
   * orientations — unlike `xTicks`/`yTicks`, which follow screen position.
   * {@link BarChartProps.categoryLabelEvery} is the unambiguous name; this is kept for
   * compatibility.
   */
  xLabelEvery?: number
  /**
   * Show every Nth category label (and always the last). Role-named twin of
   * `xLabelEvery`; wins when both are given.
   */
  categoryLabelEvery?: number
  legend?: boolean
  tooltip?: boolean
  /** Custom tooltip formatter. Stacked default lists "label · total" + per-layer values. */
  tooltipFormat?: (p: ChartPoint) => string
  className?: string
  /**
   * Marks only — no axes, grid lines, or legend. For micro/inline charts.
   *
   * @defaultValue `false`
   * @see the component manifest
   */
  plain?: boolean
  /**
   * Reference lines, bands, and markers drawn over the plot. Geometric axes: `y` is the
   * vertical axis (a threshold on a vertical bar chart's value), `x` is horizontal.
   */
  annotations?: readonly Annotation[]
  /** Print each bar's value as a label. `true` for defaults, or tune format/position. */
  labels?: LabelOptions
  /** Fired when a point is clicked or activated (Enter/Space) — for drill-down. */
  onSelect?: (point: ChartPoint) => void
  /**
   * Bar fill style — solid, a gradient, or a pattern.
   *
   * @defaultValue `solid`
   * @see the component manifest
   */
  fill?: FillKind
  /** Pattern motif when `fill="pattern"`. */
  patternKind?: PatternKind
  /**
   * Format each category/x-axis tick label. Receives the datum's raw `x` value — a number,
   * a string, or a `Date`, whichever the series carries.
   *
   * Threads through `Axis`'s own `format`, which every chart composing an axis should
   * surface (2026-07-28 report C16); enforced by `axis-parity.test.ts`.
   */
  format?: (value: number | string | Date) => string
}

const COLORS = Array.from({ length: 8 }, (_, i) => `var(--cascivo-chart-${i + 1})`)

/** Default stacked tooltip text: "label · total — Layer: v, Layer: v" (aria-live + fallback). */
function stackedFormat(p: ChartPoint): string {
  const segs = p.segments?.filter((s) => s.value !== 0) ?? []
  const head = `${p.label} · ${p.value}`
  return segs.length > 0
    ? `${head} — ${segs.map((s) => `${s.label}: ${s.value}`).join(', ')}`
    : head
}

export function BarChart<Datum = { x: string; y: number }>({
  series,
  x,
  y,
  title,
  description,
  orientation = 'vertical',
  mode = 'grouped',
  width: fixedWidth,
  height,
  xTicks = 5,
  yTicks = 5,
  valueAxisTicks,
  categoryAxisTicks,
  xLabelEvery,
  categoryLabelEvery,
  legend,
  tooltip,
  tooltipFormat,
  className,
  plain,
  annotations,
  labels,
  onSelect,
  fill = 'solid',
  patternKind,
  format: xFormat,
}: BarChartProps<Datum>) {
  useSignals()
  const defsId = useId()
  const resolvedLabels = plain ? null : resolveLabels(labels)
  const hidden = useSignal(new Set<string>())
  const resolvedHeight = height ?? (plain ? 48 : 300)
  const showLegend = plain ? false : (legend ?? series.length > 1)

  // Per-series Y accessor: a series may override the chart-level `y` (e.g. to plot
  // a different field from a shared data row). Falls back to the chart-level `y`.
  const yFor = (s: BarChartSeries<Datum>) => s.y ?? y

  const categories = (series[0]?.data ?? []).map((d) => x(d))
  const allY = series.flatMap((s) => s.data.map((d) => yFor(s)(d)))
  const hasData = categories.length > 0

  // 'stacked' and 'percent' both stack; 'percent' normalizes each category to 1.
  const isStackLike = mode === 'stacked' || mode === 'percent'
  const categoryTotals = categories.map((_, i) =>
    series.reduce((sum, s) => sum + yFor(s)(s.data[i]!), 0),
  )

  /** Stacked [y0, y1] offsets per series/category; normalized to [0,1] in percent mode. */
  const computeOffsets = (): [number, number][][] => {
    const raw = stackSeries(series.map((s) => s.data.map((d) => yFor(s)(d))))
    if (mode !== 'percent') return raw
    return raw.map((seriesOffsets) =>
      seriesOffsets.map(([y0, y1], i) => {
        const t = categoryTotals[i] || 1
        return [y0 / t, y1 / t] as [number, number]
      }),
    )
  }

  const yMin = isStackLike ? 0 : Math.min(0, ...allY)
  const yMaxStacked = hasData ? Math.max(...categoryTotals) : 1
  const yMax = mode === 'percent' ? 1 : mode === 'stacked' ? yMaxStacked : Math.max(1, ...allY)

  /** Value-axis tick format — percent mode shows 0–100%. */
  const valFormat =
    mode === 'percent'
      ? (v: number | string | Date) => `${Math.round(Number(v) * 100)}%`
      : undefined

  const isVerticalChart = orientation === 'vertical'

  // Resolve the role-named axis props onto the screen-named ones the render path uses.
  // This is the single place the swap happens, so `valueAxisTicks` means the value axis on
  // BOTH orientations while `xTicks`/`yTicks` keep their existing screen-position meaning
  // for anyone already passing them (2026-07-28 report C17b).
  const resolvedYTicks = (isVerticalChart ? valueAxisTicks : categoryAxisTicks) ?? yTicks
  const resolvedXTicks = (isVerticalChart ? categoryAxisTicks : valueAxisTicks) ?? xTicks
  // `xLabelEvery` never swapped — it always strides the category axis — so its role-named
  // twin is a plain alias rather than an orientation-dependent pick.
  const resolvedLabelEvery = categoryLabelEvery ?? xLabelEvery

  // Reserve left-margin room for the widest left-axis label so it isn't clipped:
  // value ticks when vertical, category labels when horizontal.
  const leftAxisLabels = isVerticalChart
    ? linearScale([yMin, yMax], [0, 1])
        .ticks(resolvedYTicks)
        .map((v) => (valFormat ? valFormat(v) : v.toLocaleString()))
    : categories.map((c) => String(c))
  // The final bottom-axis label is centred on the plot's right edge, so half of it
  // overhangs into the right margin — the default 8px clipped it on every chart.
  const bottomAxisLabels = isVerticalChart
    ? categories.map((c) => String(c))
    : linearScale([yMin, yMax], [0, 1])
        .ticks(resolvedXTicks)
        .map((v) => (valFormat ? valFormat(v) : v.toLocaleString()))
  const margins = plain
    ? PLAIN_MARGINS
    : {
        ...DEFAULT_MARGINS,
        left: leftMarginForLabels(leftAxisLabels, plain),
        right: rightMarginForLabels({ bottomAxisLabels, plain }),
      }

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
              <td key={s.id}>{s.data[i] != null ? yFor(s)(s.data[i]!) : ''}</td>
            ))}
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
    if (!tooltip || !hasData) return undefined
    const innerW = w - margins.left - margins.right
    const innerH = h - margins.top - margins.bottom
    const isVertical = orientation === 'vertical'
    const catScale = bandScale(categories, isVertical ? [0, innerW] : [0, innerH], 0.2)
    const valScale = linearScale([yMin, yMax], isVertical ? [innerH, 0] : [0, innerW])
    const visibleSeries = series.filter((s) => !hidden.value.has(s.id))

    let stackedOffsets: [number, number][][] = []
    if (isStackLike) {
      stackedOffsets = computeOffsets()
    }

    // Stacked default (no custom formatter): attach the per-category breakdown so
    // the tooltip can show "label · total" + each non-zero layer in its color.
    const useStackedDefault = isStackLike && !tooltipFormat
    const breakdownByCat = categories.map((_, di) => {
      const segs = visibleSeries.map((s) => ({
        label: s.label,
        value: yFor(s)(s.data[di]!),
        // The tooltip names one category, so it can resolve the exact datum's color.
        color: resolveColor(s.color, s.data[di], di, COLORS[series.indexOf(s) % COLORS.length]!),
      }))
      return { segs, total: segs.reduce((sum, seg) => sum + seg.value, 0) }
    })

    const points: ChartPoint[] = visibleSeries.flatMap((s) => {
      const seriesIdx = series.indexOf(s)
      const subBandW =
        mode === 'grouped' ? catScale.bandwidth / visibleSeries.length : catScale.bandwidth
      return s.data.map((d, di) => {
        const catPos = catScale.map(x(d)) ?? 0
        let val: number
        let baseVal: number
        if (isStackLike && stackedOffsets[seriesIdx]) {
          const offset = stackedOffsets[seriesIdx]![di]!
          val = offset[1]
          baseVal = offset[0]
        } else {
          val = yFor(s)(d)
          baseVal = yMin
        }
        const siInVisible = visibleSeries.indexOf(s)
        const barStart = catPos + (mode === 'grouped' ? siInVisible * subBandW : 0)
        const barCenter = barStart + subBandW / 2
        const valStart = Math.min(valScale.map(val), valScale.map(baseVal))
        const valEnd = Math.max(valScale.map(val), valScale.map(baseVal))
        const valMid = (valStart + valEnd) / 2
        return {
          id: `${s.id}-${di}`,
          cx: margins.left + (isVertical ? barCenter : valMid),
          cy: margins.top + (isVertical ? valMid : barCenter),
          label: x(d),
          value: useStackedDefault ? breakdownByCat[di]!.total : yFor(s)(d),
          seriesId: s.id,
          ...(useStackedDefault && { segments: breakdownByCat[di]!.segs }),
        }
      })
    })
    const format = tooltipFormat ?? (useStackedDefault ? stackedFormat : undefined)
    return format ? { points, format } : { points }
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
        tooltip={tooltip && hasData ? buildTooltip : undefined}
        onSelect={onSelect}
      >
        {({ width, height: h }) => {
          const innerW = width - margins.left - margins.right
          const innerH = h - margins.top - margins.bottom
          const isVertical = orientation === 'vertical'
          // Thin a crowded category axis automatically; an explicit stride prop wins.
          // Horizontal bars run their categories down the y-axis, where labels stack and
          // compete for height rather than width — so the direction has to travel with the
          // length, or long category names strand a chart that has plenty of room.
          const labelEvery =
            resolvedLabelEvery ??
            autoLabelStride(
              categories,
              isVertical ? innerW : innerH,
              isVertical ? 'horizontal' : 'vertical',
            )

          const catScale = bandScale(categories, isVertical ? [0, innerW] : [0, innerH], 0.2)
          const valScale = linearScale(
            isVertical ? [yMin, yMax] : [yMin, yMax],
            isVertical ? [innerH, 0] : [0, innerW],
          )

          const visibleSeries = series.filter((s) => !hidden.value.has(s.id))

          let stackedOffsets: [number, number][][] = []
          if (isStackLike) {
            stackedOffsets = computeOffsets()
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
                    color: resolveColor(s.color, s.data[0], 0, COLORS[si % COLORS.length]!),
                  }))}
                />
              )}
              <g transform={`translate(${margins.left},${margins.top})`}>
                {!plain && isVertical && (
                  <GridLines
                    scale={valScale}
                    orientation="y"
                    length={innerW}
                    tickCount={resolvedYTicks}
                  />
                )}
                {!plain && !isVertical && (
                  <GridLines
                    scale={valScale}
                    orientation="x"
                    length={innerH}
                    tickCount={resolvedXTicks}
                  />
                )}
                {!plain &&
                  renderAnnotations(annotations, {
                    xScale: isVertical ? catScale : valScale,
                    yScale: isVertical ? valScale : catScale,
                    innerW,
                    innerH,
                  })}
                {visibleSeries.map((s, si) => {
                  const paletteColor = COLORS[series.indexOf(s) % COLORS.length]!
                  const seriesIdx = series.indexOf(s)
                  const subBandW =
                    mode === 'grouped'
                      ? catScale.bandwidth / visibleSeries.length
                      : catScale.bandwidth

                  return s.data.map((d, di) => {
                    const catPos = catScale.map(x(d)) ?? 0
                    let val: number
                    let baseVal: number
                    if (isStackLike && stackedOffsets[seriesIdx]) {
                      const offset = stackedOffsets[seriesIdx]![di]!
                      val = offset[1]
                      baseVal = offset[0]
                    } else {
                      val = yFor(s)(d)
                      baseVal = yMin
                    }
                    const barStart = catPos + (mode === 'grouped' ? si * subBandW : 0)
                    const valStart = Math.min(valScale.map(val), valScale.map(baseVal))
                    const valLen = Math.abs(valScale.map(val) - valScale.map(baseVal))

                    // Optional value label, collision-aware: above the bar, flipping
                    // inside when there's no room (short bar or stacked segment).
                    let label: React.ReactNode = null
                    if (resolvedLabels) {
                      const text = resolvedLabels.format(yFor(s)(d))
                      const center = barStart + subBandW / 2
                      const inside = isStackLike || valLen < 18 || valStart < 14
                      if (isVertical) {
                        label = (
                          <DataLabel
                            x={center}
                            y={inside ? valStart + 13 : valStart - 4}
                            text={text}
                            tone={inside ? 'muted' : 'default'}
                          />
                        )
                      } else {
                        const end = valStart + valLen
                        label = (
                          <DataLabel
                            x={inside ? end - 4 : end + 4}
                            y={center + 4}
                            text={text}
                            anchor={inside ? 'end' : 'start'}
                            tone={inside ? 'muted' : 'default'}
                          />
                        )
                      }
                      // A stacked segment too small to hold a label gets none.
                      if (isStackLike && valLen < 14) label = null
                    }

                    // Per-datum color when `series.color` is a function; the series color
                    // otherwise. `fillFor` still routes through the gradient/pattern defs,
                    // which are keyed by series — a per-datum color falls back to a flat
                    // fill there, which is the only sensible reading of "one gradient, many
                    // colors".
                    const barColor = resolveColor(s.color, d, di, paletteColor)
                    // `data-x` is the CSS hook for a single bar. Without it every <rect>
                    // sits alone in its own <g>, so `rect:nth-of-type(n)` matches EVERY bar
                    // at n=1 and none at n>=2 — the only selector that distinguished bars
                    // was position among sibling <g>s, an implementation detail that breaks
                    // the moment `annotations` add another sibling (2026-07-28 report C18).
                    const rect = isVertical ? (
                      <rect
                        x={barStart}
                        y={valStart}
                        width={subBandW}
                        height={valLen}
                        fill={fillFor(defsId, s.id, fill, barColor)}
                        rx={2}
                        data-series={s.id}
                        data-x={String(x(d))}
                      />
                    ) : (
                      <rect
                        x={valStart}
                        y={barStart}
                        width={valLen}
                        height={subBandW}
                        fill={fillFor(defsId, s.id, fill, barColor)}
                        rx={2}
                        data-series={s.id}
                        data-x={String(x(d))}
                      />
                    )
                    return (
                      <g key={`${s.id}-${di}`}>
                        {rect}
                        {label}
                      </g>
                    )
                  })
                })}
                {!plain && isVertical && (
                  <>
                    <Axis
                      scale={catScale}
                      orientation="x"
                      length={innerW}
                      tickCount={resolvedXTicks}
                      labelEvery={labelEvery}
                      transform={`translate(0,${innerH})`}
                      {...(xFormat ? { format: xFormat } : {})}
                    />
                    <Axis
                      scale={valScale}
                      orientation="y"
                      length={innerH}
                      tickCount={resolvedYTicks}
                      {...(valFormat && { format: valFormat })}
                    />
                  </>
                )}
                {!plain && !isVertical && (
                  <>
                    <Axis
                      scale={valScale}
                      orientation="x"
                      length={innerW}
                      tickCount={resolvedXTicks}
                      {...(valFormat && { format: valFormat })}
                      transform={`translate(0,${innerH})`}
                    />
                    <Axis
                      scale={catScale}
                      orientation="y"
                      length={innerH}
                      tickCount={resolvedYTicks}
                      labelEvery={labelEvery}
                    />
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
            color: resolveColor(s.color, s.data[0], 0, COLORS[i % COLORS.length]!),
          }))}
          hidden={hidden}
        />
      )}
    </div>
  )
}
