'use client'
import { useSignals } from '@cascade-ui/core'
import { ChartFrame } from '../../core/chart-frame'
import { DEFAULT_MARGINS, PLAIN_MARGINS } from '../../core/use-chart'
import { Axis } from '../../chrome/axis'
import { GridLines } from '../../chrome/grid-lines'
import { linearScale, bandScale } from '../../engine/scale'
import { linePath } from '../../engine/shape'

export interface ComboChartBar {
  label: string
  value: number
}

export interface ComboChartPoint {
  x: number
  y: number
}

export interface ComboChartProps {
  bars: ComboChartBar[]
  line: ComboChartPoint[]
  title: string
  description?: string
  secondAxis?: boolean
  width?: number
  height?: number
  className?: string
  /** Render only the marks — no axes or grid lines. For micro/inline charts. */
  plain?: boolean
}

export function ComboChart({
  bars,
  line,
  title,
  description,
  secondAxis = false,
  width: fixedWidth,
  height,
  className,
  plain,
}: ComboChartProps) {
  useSignals()
  const resolvedHeight = height ?? (plain ? 48 : 320)
  const margins = plain
    ? PLAIN_MARGINS
    : { ...DEFAULT_MARGINS, right: secondAxis ? 60 : DEFAULT_MARGINS.right }

  const barMax = bars.reduce((m, b) => Math.max(m, b.value), 0) || 1
  const lineMin = line.length > 0 ? Math.min(...line.map((p) => p.y)) : 0
  const lineMax = line.length > 0 ? Math.max(...line.map((p) => p.y)) : 1

  const fallback = (
    <table>
      <caption>{title}</caption>
      <thead>
        <tr>
          <th>Label</th>
          <th>Bar value</th>
        </tr>
      </thead>
      <tbody>
        {bars.map((b) => (
          <tr key={b.label}>
            <td>{b.label}</td>
            <td>{b.value}</td>
          </tr>
        ))}
      </tbody>
    </table>
  )

  return (
    <ChartFrame
      title={title}
      description={description}
      width={fixedWidth}
      height={resolvedHeight}
      fallback={fallback}
      className={className}
      plain={plain}
    >
      {({ width, height: h }) => {
        const inner = {
          width: width - margins.left - margins.right,
          height: h - margins.top - margins.bottom,
        }
        if (inner.width <= 0 || bars.length === 0) return null

        const xScale = bandScale(
          bars.map((b) => b.label),
          [0, inner.width],
          0.2,
        )
        const barYScale = linearScale([0, barMax], [inner.height, 0])

        // Line x: map by index if line.length === bars.length, else by line.x as fraction
        const lineYScale = secondAxis
          ? linearScale([lineMin, lineMax || lineMin + 1], [inner.height, 0])
          : barYScale

        const linePoints: [number, number][] = line.map((p, i) => {
          const bx = bars[i]
            ? (xScale.map(bars[i]!.label) ?? 0) + xScale.bandwidth / 2
            : (inner.width * p.x) / Math.max(1, line.length - 1)
          return [bx, lineYScale.map(p.y)]
        })

        const pathD = linePoints.length > 1 ? linePath(linePoints, 'monotone') : ''

        return (
          <g transform={`translate(${margins.left},${margins.top})`}>
            {!plain && <GridLines scale={barYScale} orientation="y" length={inner.width} />}
            {bars.map((b) => {
              const bx = xScale.map(b.label) ?? 0
              const by = barYScale.map(b.value)
              return (
                <rect
                  key={b.label}
                  x={bx}
                  y={by}
                  width={xScale.bandwidth}
                  height={Math.max(0, inner.height - by)}
                  fill="var(--cascade-chart-1)"
                  opacity={0.75}
                  aria-label={`${b.label}: ${b.value}`}
                />
              )
            })}
            {pathD && (
              <path
                d={pathD}
                fill="none"
                stroke="var(--cascade-chart-2)"
                strokeWidth={2.5}
                strokeLinejoin="round"
                strokeLinecap="round"
              />
            )}
            {!plain && (
              <>
                <Axis
                  scale={xScale}
                  orientation="x"
                  length={inner.width}
                  transform={`translate(0,${inner.height})`}
                />
                <Axis scale={barYScale} orientation="y" length={inner.height} />
                {secondAxis && (
                  <Axis
                    scale={lineYScale}
                    orientation="y"
                    length={inner.height}
                    transform={`translate(${inner.width},0)`}
                  />
                )}
              </>
            )}
          </g>
        )
      }}
    </ChartFrame>
  )
}
