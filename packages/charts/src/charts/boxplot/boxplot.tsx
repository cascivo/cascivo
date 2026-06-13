'use client'
import { useSignals } from '@cascivo/core'
import { ChartFrame } from '../../core/chart-frame'
import { DEFAULT_MARGINS, PLAIN_MARGINS } from '../../core/use-chart'
import { Axis } from '../../chrome/axis'
import { linearScale, bandScale } from '../../engine/scale'
import { boxStats, extent } from '../../engine/stats'
import type { ChartPoint, TooltipModel } from '../../core/data-point'

export interface BoxplotSeries {
  id: string
  label: string
  values: number[]
}

export interface BoxplotProps {
  series: BoxplotSeries[]
  title: string
  description?: string
  width?: number
  height?: number
  className?: string
  /** Render only the marks — no axes. For micro/inline charts. */
  plain?: boolean
}

const COLORS = Array.from({ length: 8 }, (_, i) => `var(--cascivo-chart-${i + 1})`)

export function Boxplot({
  series,
  title,
  description,
  width: fixedWidth,
  height,
  className,
  plain,
}: BoxplotProps) {
  useSignals()
  const margins = plain ? PLAIN_MARGINS : DEFAULT_MARGINS
  const resolvedHeight = height ?? (plain ? 48 : 320)

  const stats = series.map((s) => ({ ...s, stats: boxStats(s.values) }))
  const allValues = series.flatMap((s) => s.values)
  const [globalMin, globalMax] = allValues.length > 0 ? extent(allValues) : [0, 1]

  const fallback = (
    <table>
      <caption>{title}</caption>
      <thead>
        <tr>
          <th>Series</th>
          <th>Min</th>
          <th>Q1</th>
          <th>Median</th>
          <th>Q3</th>
          <th>Max</th>
        </tr>
      </thead>
      <tbody>
        {stats.map((s) => (
          <tr key={s.id}>
            <td>{s.label}</td>
            <td>{s.stats.min.toFixed(2)}</td>
            <td>{s.stats.q1.toFixed(2)}</td>
            <td>{s.stats.median.toFixed(2)}</td>
            <td>{s.stats.q3.toFixed(2)}</td>
            <td>{s.stats.max.toFixed(2)}</td>
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
    if (stats.length === 0) return undefined
    const innerW = w - margins.left - margins.right
    const innerH = h - margins.top - margins.bottom
    if (innerW <= 0) return undefined
    const xScale = bandScale(
      stats.map((s) => s.id),
      [0, innerW],
      0.3,
    )
    const yPad = (globalMax - globalMin) * 0.05 || 1
    const yScale = linearScale([globalMin - yPad, globalMax + yPad], [innerH, 0])

    const points: ChartPoint[] = stats.map((s) => {
      const cx = (xScale.map(s.id) ?? 0) + xScale.bandwidth / 2
      return {
        id: s.id,
        cx: margins.left + cx,
        cy: margins.top + yScale.map(s.stats.median),
        label: s.label,
        value: s.stats.median,
      }
    })
    return {
      points,
      format: (p) => {
        const s = stats.find((st) => st.id === p.id)
        if (!s) return `${p.label}: ${p.value}`
        return `${s.label}: min ${s.stats.min.toFixed(2)} / Q1 ${s.stats.q1.toFixed(2)} / med ${s.stats.median.toFixed(2)} / Q3 ${s.stats.q3.toFixed(2)} / max ${s.stats.max.toFixed(2)}`
      },
    }
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
      tooltip={stats.length > 0 ? buildTooltip : undefined}
    >
      {({ width, height: h }) => {
        const inner = {
          width: width - margins.left - margins.right,
          height: h - margins.top - margins.bottom,
        }
        if (inner.width <= 0 || stats.length === 0) return null

        const xScale = bandScale(
          stats.map((s) => s.id),
          [0, inner.width],
          0.3,
        )
        const yPad = (globalMax - globalMin) * 0.05 || 1
        const yScale = linearScale([globalMin - yPad, globalMax + yPad], [inner.height, 0])

        return (
          <g transform={`translate(${margins.left},${margins.top})`}>
            {stats.map((s, idx) => {
              const color = COLORS[idx % COLORS.length] ?? 'var(--cascivo-chart-1)'
              const cx = (xScale.map(s.id) ?? 0) + xScale.bandwidth / 2
              const boxW = xScale.bandwidth * 0.6
              const boxX = cx - boxW / 2

              const yQ1 = yScale.map(s.stats.q1)
              const yQ3 = yScale.map(s.stats.q3)
              const yMed = yScale.map(s.stats.median)
              const yMinV = yScale.map(s.stats.min)
              const yMaxV = yScale.map(s.stats.max)

              return (
                <g key={s.id} aria-label={`${s.label}: median ${s.stats.median.toFixed(2)}`}>
                  {/* Upper whisker: from q3 to max */}
                  <line x1={cx} y1={yQ3} x2={cx} y2={yMaxV} stroke={color} strokeWidth={1.5} />
                  {/* Lower whisker: from q1 to min */}
                  <line x1={cx} y1={yQ1} x2={cx} y2={yMinV} stroke={color} strokeWidth={1.5} />
                  {/* Whisker caps */}
                  <line
                    x1={cx - boxW / 4}
                    y1={yMaxV}
                    x2={cx + boxW / 4}
                    y2={yMaxV}
                    stroke={color}
                    strokeWidth={1.5}
                  />
                  <line
                    x1={cx - boxW / 4}
                    y1={yMinV}
                    x2={cx + boxW / 4}
                    y2={yMinV}
                    stroke={color}
                    strokeWidth={1.5}
                  />
                  {/* Box */}
                  <rect
                    x={boxX}
                    y={yQ3}
                    width={boxW}
                    height={Math.max(0, yQ1 - yQ3)}
                    fill={color}
                    fillOpacity={0.25}
                    stroke={color}
                    strokeWidth={1.5}
                  />
                  {/* Median line */}
                  <line
                    x1={boxX}
                    y1={yMed}
                    x2={boxX + boxW}
                    y2={yMed}
                    stroke={color}
                    strokeWidth={2.5}
                  />
                  {/* Outliers */}
                  {s.stats.outliers.map((o, oi) => (
                    <circle
                      key={oi}
                      cx={cx}
                      cy={yScale.map(o)}
                      r={3}
                      fill="none"
                      stroke={color}
                      strokeWidth={1.5}
                      aria-label={`Outlier: ${o.toFixed(2)}`}
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
