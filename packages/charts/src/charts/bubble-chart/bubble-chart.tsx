'use client'
import { useSignal, useSignals } from '@cascivo/core'
import { ChartFrame } from '../../core/chart-frame'
import { DEFAULT_MARGINS, PLAIN_MARGINS } from '../../core/use-chart'
import { Axis } from '../../chrome/axis'
import { GridLines } from '../../chrome/grid-lines'
import { Glyph, type GlyphShape } from '../../chrome/glyph'
import { linearScale, sqrtScale } from '../../engine/scale'
import { extent } from '../../engine/stats'
import type { ChartPoint, TooltipModel } from '../../core/data-point'

export interface BubbleDatum {
  x: number
  y: number
  size: number
}

export interface BubbleSeries {
  name: string
  data: BubbleDatum[]
}

export interface BubbleChartProps {
  series: BubbleSeries[]
  title: string
  description?: string
  width?: number
  height?: number
  tooltip?: boolean
  className?: string
  /** Render only the marks — no axes or grid lines. For micro/inline charts. */
  plain?: boolean
  /** Point glyph shape — a fixed shape, or a function to encode a category by shape. Defaults to a circle. */
  glyph?: GlyphShape | ((d: BubbleDatum, seriesName: string) => GlyphShape)
}

const COLORS = Array.from({ length: 8 }, (_, i) => `var(--cascivo-chart-${i + 1})`)
const MIN_R = 3
const MAX_R = 24

export function BubbleChart({
  series,
  title,
  description,
  width: fixedWidth,
  height,
  tooltip,
  className,
  plain,
  glyph,
}: BubbleChartProps) {
  useSignals()
  const hovered = useSignal<string | null>(null)
  const margins = plain ? PLAIN_MARGINS : DEFAULT_MARGINS
  const resolvedHeight = height ?? (plain ? 48 : 320)

  const allData = series.flatMap((s) => s.data)
  const [xMin, xMax] = allData.length > 0 ? extent(allData.map((d) => d.x)) : [0, 1]
  const [yMin, yMax] = allData.length > 0 ? extent(allData.map((d) => d.y)) : [0, 1]
  const [sMin, sMax] = allData.length > 0 ? extent(allData.map((d) => d.size)) : [0, 1]
  const sizeMap = sqrtScale([sMin, sMax], [MIN_R, MAX_R])
  const hasData = allData.length > 0

  const fallback = (
    <table>
      <caption>{title}</caption>
      <thead>
        <tr>
          <th>Series</th>
          <th>X</th>
          <th>Y</th>
          <th>Size</th>
        </tr>
      </thead>
      <tbody>
        {series.flatMap((s) =>
          s.data.map((d, i) => (
            <tr key={`${s.name}-${i}`}>
              <td>{s.name}</td>
              <td>{d.x}</td>
              <td>{d.y}</td>
              <td>{d.size}</td>
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

    const inner = {
      width: w - margins.left - margins.right,
      height: h - margins.top - margins.bottom,
    }
    if (inner.width <= 0) return undefined

    const xPad = (xMax - xMin) * 0.05 || 1
    const yPad = (yMax - yMin) * 0.05 || 1
    const xScale = linearScale([xMin - xPad, xMax + xPad], [0, inner.width])
    const yScale = linearScale([yMin - yPad, yMax + yPad], [inner.height, 0])

    const points: ChartPoint[] = series.flatMap((s, si) =>
      s.data.map((d, di) => ({
        id: `${si}-${di}`,
        cx: margins.left + xScale.map(d.x),
        cy: margins.top + yScale.map(d.y),
        label: `${s.name} (${d.x}, ${d.y})`,
        value: d.y,
        seriesId: s.name,
      })),
    )

    return { points }
  }

  return (
    <ChartFrame
      title={title}
      description={description}
      width={fixedWidth}
      height={resolvedHeight}
      fallback={fallback}
      className={className}
      plain={plain}
      tooltip={tooltip !== false && hasData ? buildTooltip : undefined}
      hover="voronoi"
    >
      {({ width, height: h }) => {
        const inner = {
          width: width - margins.left - margins.right,
          height: h - margins.top - margins.bottom,
        }
        if (inner.width <= 0 || allData.length === 0) return null

        const xPad = (xMax - xMin) * 0.05 || 1
        const yPad = (yMax - yMin) * 0.05 || 1
        const xScale = linearScale([xMin - xPad, xMax + xPad], [0, inner.width])
        const yScale = linearScale([yMin - yPad, yMax + yPad], [inner.height, 0])

        return (
          <g transform={`translate(${margins.left},${margins.top})`}>
            {!plain && <GridLines scale={yScale} orientation="y" length={inner.width} />}
            {series.map((s, si) => {
              const color = COLORS[si % COLORS.length] ?? 'var(--cascivo-chart-1)'
              const isHidden = hovered.value !== null && hovered.value !== s.name
              return (
                <g
                  key={s.name}
                  opacity={isHidden ? 0.2 : 1}
                  onMouseEnter={() => {
                    hovered.value = s.name
                  }}
                  onMouseLeave={() => {
                    hovered.value = null
                  }}
                >
                  {s.data.map((d, di) => {
                    const shape = typeof glyph === 'function' ? glyph(d, s.name) : glyph
                    const label = `${s.name}: x=${d.x}, y=${d.y}, size=${d.size}`
                    if (shape && shape !== 'circle') {
                      return (
                        <g key={di} aria-label={label}>
                          <Glyph
                            shape={shape}
                            x={xScale.map(d.x)}
                            y={yScale.map(d.y)}
                            size={sizeMap(d.size) * 2}
                            color={color}
                            opacity={0.6}
                            stroke={color}
                            strokeWidth={1}
                          />
                        </g>
                      )
                    }
                    return (
                      <circle
                        key={di}
                        cx={xScale.map(d.x)}
                        cy={yScale.map(d.y)}
                        r={sizeMap(d.size)}
                        fill={color}
                        fillOpacity={0.6}
                        stroke={color}
                        strokeWidth={1}
                        aria-label={label}
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
                  length={inner.width}
                  transform={`translate(0,${inner.height})`}
                />
                <Axis scale={yScale} orientation="y" length={inner.height} />
              </>
            )}
          </g>
        )
      }}
    </ChartFrame>
  )
}
