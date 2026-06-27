'use client'
import { useSignal, useSignals } from '@cascivo/core'
import { ChartFrame } from '../../core/chart-frame'
import { DEFAULT_MARGINS, PLAIN_MARGINS } from '../../core/use-chart'
import { Axis } from '../../chrome/axis'
import { GridLines } from '../../chrome/grid-lines'
import { Legend } from '../../chrome/legend'
import { renderAnnotations, type Annotation } from '../../chrome/reference'
import { Glyph, type GlyphShape } from '../../chrome/glyph'
import { VisualMap, mapVisual, visualVisible, type VisualMapOptions } from '../../chrome/visual-map'
import { resolveColor, type CanvasPaint } from '../../core/canvas-layer'
import { linearScale } from '../../engine/scale'
import type { ChartPoint, TooltipModel } from '../../core/data-point'

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
  tooltip?: boolean
  className?: string
  /** Render only the marks — no axes, grid lines, or legend. For micro/inline charts. */
  plain?: boolean
  /** Reference lines, shaded bands, and markers drawn over the plot (target/threshold annotations). */
  annotations?: readonly Annotation[]
  /** Fired when a point is clicked or activated (Enter/Space) — for drill-down. */
  onSelect?: (point: ChartPoint) => void
  /** Point glyph shape — a fixed shape, or a function to encode a category by shape. Defaults to a circle. */
  glyph?: GlyphShape | ((d: ScatterDatum, seriesId: string) => GlyphShape)
  /** Renderer: `svg` (default), `canvas` (force), or `auto` (canvas past ~2000 points). */
  renderer?: 'svg' | 'canvas' | 'auto'
  /** Map each point's y → CVD-safe colour and/or size via a legend that filters the range. */
  visualMap?: VisualMapOptions
}

const COLORS = Array.from({ length: 8 }, (_, i) => `var(--cascivo-chart-${i + 1})`)

export function ScatterChart({
  series,
  title,
  description,
  r: rProp = 4,
  width: fixedWidth,
  height,
  xTicks = 5,
  yTicks = 5,
  legend,
  tooltip,
  className,
  plain,
  annotations,
  onSelect,
  glyph,
  renderer = 'svg',
  visualMap,
}: ScatterChartProps) {
  useSignals()
  const hidden = useSignal(new Set<string>())
  const margins = plain ? PLAIN_MARGINS : DEFAULT_MARGINS
  const resolvedHeight = height ?? (plain ? 48 : 300)
  const showLegend = plain ? false : (legend ?? series.length > 1)
  const pointCount = series.reduce((n, s) => n + s.data.length, 0)
  // visualMap forces the SVG path (per-point colour/size encoding).
  const useCanvas =
    !visualMap && (renderer === 'canvas' || (renderer === 'auto' && pointCount > 2000))

  // visualMap filter signals (continuous range + piecewise hidden buckets).
  const vmRange = useSignal<[number, number]>([visualMap?.min ?? 0, visualMap?.max ?? 1])
  const vmHidden = useSignal(new Set<number>())

  /** Paint the points to a canvas (large-data path). Mirrors the SVG marks. */
  const paint: CanvasPaint = (ctx, { width: cw, height: ch }) => {
    const innerW = cw - margins.left - margins.right
    const innerH = ch - margins.top - margins.bottom
    if (innerW <= 0 || innerH <= 0) return
    const xScale = linearScale([xMin, xMax], [0, innerW])
    const yScale = linearScale([yMin, yMax], [innerH, 0])
    series.forEach((s, si) => {
      if (hidden.value.has(s.id)) return
      ctx.fillStyle = resolveColor(ctx, s.color ?? COLORS[si % COLORS.length]!)
      ctx.globalAlpha = 0.7
      for (const d of s.data) {
        const radius = typeof rProp === 'function' ? rProp(d) : (d.r ?? rProp)
        ctx.beginPath()
        ctx.arc(
          margins.left + xScale.map(d.x),
          margins.top + yScale.map(d.y),
          radius,
          0,
          Math.PI * 2,
        )
        ctx.fill()
      }
    })
    ctx.globalAlpha = 1
  }

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
        cx: margins.left + xScale.map(d.x),
        cy: margins.top + yScale.map(d.y),
        label: `(${d.x}, ${d.y})`,
        value: d.y,
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
        hover="voronoi"
        renderer={useCanvas ? 'canvas' : 'svg'}
        paint={useCanvas ? paint : undefined}
      >
        {({ width, height: h }) => {
          const innerW = width - margins.left - margins.right
          const innerH = h - margins.top - margins.bottom
          const xScale = linearScale([xMin, xMax], [0, innerW])
          const yScale = linearScale([yMin, yMax], [innerH, 0])

          return (
            <g>
              <g transform={`translate(${margins.left},${margins.top})`}>
                {!plain && (
                  <GridLines scale={yScale} orientation="y" length={innerW} tickCount={yTicks} />
                )}
                {!plain && renderAnnotations(annotations, { xScale, yScale, innerW, innerH })}
                {!useCanvas &&
                  series.map((s, si) => {
                    if (hidden.value.has(s.id)) return null
                    const color = s.color ?? COLORS[si % COLORS.length]!
                    return (
                      <g key={s.id} data-series={s.id}>
                        {s.data.map((d, di) => {
                          const baseR = typeof rProp === 'function' ? rProp(d) : (d.r ?? rProp)
                          const vm = visualMap ? mapVisual(d.y, visualMap) : undefined
                          const radius = vm?.size ?? baseR
                          const markColor = vm?.color ?? color
                          const visible = visualMap
                            ? visualVisible(d.y, visualMap, vmRange.value, vmHidden.value)
                            : true
                          const op = visible ? 0.7 : 0.1
                          const shape = typeof glyph === 'function' ? glyph(d, s.id) : glyph
                          if (shape && shape !== 'circle') {
                            return (
                              <Glyph
                                key={di}
                                shape={shape}
                                x={xScale.map(d.x)}
                                y={yScale.map(d.y)}
                                size={radius * 2}
                                color={markColor}
                                opacity={visible ? 0.75 : 0.1}
                                stroke={markColor}
                                strokeWidth={1}
                              />
                            )
                          }
                          return (
                            <circle
                              key={di}
                              cx={xScale.map(d.x)}
                              cy={yScale.map(d.y)}
                              r={radius}
                              fill={markColor}
                              fillOpacity={op}
                              stroke={markColor}
                              strokeWidth={1}
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
      {visualMap && hasData && (
        <VisualMap options={visualMap} range={vmRange} hidden={vmHidden} label={title} />
      )}
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
