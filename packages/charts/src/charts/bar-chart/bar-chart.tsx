'use client'
import { useSignal, useSignals } from '@cascivo/core'
import { ChartFrame } from '../../core/chart-frame'
import { DEFAULT_MARGINS, PLAIN_MARGINS } from '../../core/use-chart'
import { Axis } from '../../chrome/axis'
import { GridLines } from '../../chrome/grid-lines'
import { Legend } from '../../chrome/legend'
import { renderAnnotations, type Annotation } from '../../chrome/reference'
import { DataLabel, resolveLabels, type LabelOptions } from '../../chrome/data-label'
import { linearScale, bandScale } from '../../engine/scale'
import { stackSeries } from '../../engine/shape'
import type { ChartPoint, TooltipModel } from '../../core/data-point'

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
  mode?: 'grouped' | 'stacked' | 'percent'
  width?: number
  height?: number
  xTicks?: number
  yTicks?: number
  /** Show every Nth category label (and always the last) to thin a crowded x-axis. */
  xLabelEvery?: number
  legend?: boolean
  tooltip?: boolean
  /** Custom tooltip formatter. Stacked default lists "label · total" + per-layer values. */
  tooltipFormat?: (p: ChartPoint) => string
  className?: string
  /** Render only the marks — no axes, grid lines, or legend. For micro/inline charts. */
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
  xLabelEvery,
  legend,
  tooltip,
  tooltipFormat,
  className,
  plain,
  annotations,
  labels,
  onSelect,
}: BarChartProps<Datum>) {
  useSignals()
  const resolvedLabels = plain ? null : resolveLabels(labels)
  const hidden = useSignal(new Set<string>())
  const margins = plain ? PLAIN_MARGINS : DEFAULT_MARGINS
  const resolvedHeight = height ?? (plain ? 48 : 300)
  const showLegend = plain ? false : (legend ?? series.length > 1)

  const categories = (series[0]?.data ?? []).map((d) => x(d))
  const allY = series.flatMap((s) => s.data.map((d) => y(d)))
  const hasData = categories.length > 0

  // 'stacked' and 'percent' both stack; 'percent' normalizes each category to 1.
  const isStackLike = mode === 'stacked' || mode === 'percent'
  const categoryTotals = categories.map((_, i) => series.reduce((sum, s) => sum + y(s.data[i]!), 0))

  /** Stacked [y0, y1] offsets per series/category; normalized to [0,1] in percent mode. */
  const computeOffsets = (): [number, number][][] => {
    const raw = stackSeries(series.map((s) => s.data.map((d) => y(d))))
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
        value: y(s.data[di]!),
        color: s.color ?? COLORS[series.indexOf(s) % COLORS.length]!,
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
          val = y(d)
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
          value: useStackedDefault ? breakdownByCat[di]!.total : y(d),
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
              <g transform={`translate(${margins.left},${margins.top})`}>
                {!plain && isVertical && (
                  <GridLines scale={valScale} orientation="y" length={innerW} tickCount={yTicks} />
                )}
                {!plain && !isVertical && (
                  <GridLines scale={valScale} orientation="x" length={innerH} tickCount={xTicks} />
                )}
                {!plain &&
                  renderAnnotations(annotations, {
                    xScale: isVertical ? catScale : valScale,
                    yScale: isVertical ? valScale : catScale,
                    innerW,
                    innerH,
                  })}
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
                    if (isStackLike && stackedOffsets[seriesIdx]) {
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

                    // Optional value label, collision-aware: above the bar, flipping
                    // inside when there's no room (short bar or stacked segment).
                    let label: React.ReactNode = null
                    if (resolvedLabels) {
                      const text = resolvedLabels.format(y(d))
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

                    const rect = isVertical ? (
                      <rect
                        x={barStart}
                        y={valStart}
                        width={subBandW}
                        height={valLen}
                        fill={color}
                        rx={2}
                        data-series={s.id}
                      />
                    ) : (
                      <rect
                        x={valStart}
                        y={barStart}
                        width={valLen}
                        height={subBandW}
                        fill={color}
                        rx={2}
                        data-series={s.id}
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
                      tickCount={xTicks}
                      labelEvery={xLabelEvery}
                      transform={`translate(0,${innerH})`}
                    />
                    <Axis
                      scale={valScale}
                      orientation="y"
                      length={innerH}
                      tickCount={yTicks}
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
                      tickCount={xTicks}
                      {...(valFormat && { format: valFormat })}
                      transform={`translate(0,${innerH})`}
                    />
                    <Axis
                      scale={catScale}
                      orientation="y"
                      length={innerH}
                      tickCount={yTicks}
                      labelEvery={xLabelEvery}
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
            color: s.color ?? COLORS[i % COLORS.length]!,
          }))}
          hidden={hidden}
        />
      )}
    </div>
  )
}
