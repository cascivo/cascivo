'use client'
import { useSignal, useSignals } from '@cascivo/core'
import { ChartFrame } from '../../core/chart-frame'
import { DEFAULT_MARGINS, PLAIN_MARGINS } from '../../core/use-chart'
import { Axis } from '../../chrome/axis'
import { GridLines } from '../../chrome/grid-lines'
import { Legend } from '../../chrome/legend'
import { renderAnnotations, type Annotation } from '../../chrome/reference'
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
  mode?: 'grouped' | 'stacked'
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
}: BarChartProps<Datum>) {
  useSignals()
  const hidden = useSignal(new Set<string>())
  const margins = plain ? PLAIN_MARGINS : DEFAULT_MARGINS
  const resolvedHeight = height ?? (plain ? 48 : 300)
  const showLegend = plain ? false : (legend ?? series.length > 1)

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
    if (mode === 'stacked') {
      const values = series.map((s) => s.data.map((d) => y(d)))
      stackedOffsets = stackSeries(values)
    }

    // Stacked default (no custom formatter): attach the per-category breakdown so
    // the tooltip can show "label · total" + each non-zero layer in its color.
    const useStackedDefault = mode === 'stacked' && !tooltipFormat
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
        if (mode === 'stacked' && stackedOffsets[seriesIdx]) {
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
                    <Axis scale={valScale} orientation="y" length={innerH} tickCount={yTicks} />
                  </>
                )}
                {!plain && !isVertical && (
                  <>
                    <Axis
                      scale={valScale}
                      orientation="x"
                      length={innerW}
                      tickCount={xTicks}
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
