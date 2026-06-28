'use client'
import { useSignals, useSignal } from '@cascivo/core'
import { ChartFrame } from '../../core/chart-frame'
import { DEFAULT_MARGINS, PLAIN_MARGINS } from '../../core/use-chart'
import { Axis } from '../../chrome/axis'
import { Legend } from '../../chrome/legend'
import { linearScale, bandScale } from '../../engine/scale'
import { linePath, type Curve, type Point } from '../../engine/shape'
import { streamLayout, streamExtent, type StreamOffset } from '../../engine/stream'
import type { ChartPoint, TooltipModel } from '../../core/data-point'

export interface StreamSeries {
  id: string
  label: string
  /** One value per category, aligned with `categories`. */
  values: number[]
  color?: string
}

export interface StreamProps {
  series: readonly StreamSeries[]
  /** X-axis category labels, aligned with each series' `values`. */
  categories: readonly (string | number)[]
  title: string
  description?: string
  /** `silhouette` (centered streamgraph, default) or `zero` (baseline stack). */
  offset?: StreamOffset
  curve?: Curve
  width?: number
  height?: number
  legend?: boolean
  tooltip?: boolean
  className?: string
  plain?: boolean
}

const COLORS = Array.from({ length: 8 }, (_, i) => `var(--cascivo-chart-${i + 1})`)

/** A streamgraph — stacked areas on a flowing (centered) baseline. */
export function Stream({
  series,
  categories,
  title,
  description,
  offset = 'silhouette',
  curve = 'basis',
  width: fixedWidth,
  height,
  legend,
  tooltip,
  className,
  plain,
}: StreamProps) {
  useSignals()
  const hidden = useSignal(new Set<string>())
  const margins = plain ? PLAIN_MARGINS : DEFAULT_MARGINS
  const resolvedHeight = height ?? (plain ? 48 : 300)
  const showLegend = plain ? false : (legend ?? series.length > 1)
  const hasData = categories.length > 0 && series.length > 0

  const values = series.map((s) => s.values)
  const bands = streamLayout(values, offset)
  const [yMin, yMax] = streamExtent(bands)

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
        {categories.map((c, i) => (
          <tr key={String(c)}>
            <td>{String(c)}</td>
            {series.map((s) => (
              <td key={s.id}>{s.values[i] ?? ''}</td>
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
    const xScale = bandScale(categories.map(String), [0, innerW], 0)
    const yScale = linearScale([yMin, yMax], [innerH, 0])
    const points: ChartPoint[] = series.flatMap((s, si) => {
      if (hidden.value.has(s.id)) return []
      const band = bands[si]!
      return categories.map((c, i) => {
        const mid = (band[i]![0] + band[i]![1]) / 2
        return {
          id: `${s.id}-${i}`,
          cx: margins.left + (xScale.map(String(c)) ?? 0) + xScale.bandwidth / 2,
          cy: margins.top + yScale.map(mid),
          label: `${s.label} · ${String(c)}`,
          value: s.values[i] ?? 0,
          seriesId: s.id,
          color: s.color ?? COLORS[si % COLORS.length]!,
        }
      })
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
        tooltip={tooltip && hasData ? buildTooltip : undefined}
      >
        {({ width, height: h }) => {
          const innerW = width - margins.left - margins.right
          const innerH = h - margins.top - margins.bottom
          if (innerW <= 0 || !hasData) return null
          const xScale = bandScale(categories.map(String), [0, innerW], 0)
          const yScale = linearScale([yMin, yMax], [innerH, 0])
          const xOf = (i: number) => (xScale.map(String(categories[i])) ?? 0) + xScale.bandwidth / 2

          return (
            <g transform={`translate(${margins.left},${margins.top})`}>
              {series.map((s, si) => {
                if (hidden.value.has(s.id)) return null
                const band = bands[si]!
                const color = s.color ?? COLORS[si % COLORS.length]!
                const top: Point[] = categories.map((_, i) => [xOf(i), yScale.map(band[i]![1])])
                const base: Point[] = categories.map((_, i) => [xOf(i), yScale.map(band[i]![0])])
                const topPath = linePath(top, curve)
                const basePath = linePath([...base].reverse(), curve).replace(/^M/, 'L')
                const d = `${topPath}${basePath}Z`
                return <path key={s.id} d={d} fill={color} fillOpacity={0.85} data-series={s.id} />
              })}
              {!plain && (
                <Axis
                  scale={xScale}
                  orientation="x"
                  length={innerW}
                  transform={`translate(0,${innerH})`}
                />
              )}
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
