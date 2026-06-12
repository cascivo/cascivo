'use client'
import { useSignal, useSignals } from '@cascade-ui/core'
import { ChartFrame } from '../../core/chart-frame'
import { DEFAULT_MARGINS, PLAIN_MARGINS } from '../../core/use-chart'
import { Axis } from '../../chrome/axis'
import { GridLines } from '../../chrome/grid-lines'
import { linearScale } from '../../engine/scale'
import { binValues } from '../../engine/stats'

export interface HistogramProps {
  data: number[]
  bins?: number
  title: string
  label: string
  description?: string
  width?: number
  height?: number
  className?: string
  /** Render only the marks — no axes or grid lines. For micro/inline charts. */
  plain?: boolean
}

export function Histogram({
  data,
  bins,
  title,
  label: _label,
  description,
  width: fixedWidth,
  height,
  className,
  plain,
}: HistogramProps) {
  useSignals()
  const tooltip = useSignal<{ x: number; y: number; text: string } | null>(null)
  const margins = plain ? PLAIN_MARGINS : DEFAULT_MARGINS
  const resolvedHeight = height ?? (plain ? 48 : 300)

  const binnedData = binValues(data, bins)
  const maxCount = binnedData.reduce((m, b) => Math.max(m, b.count), 0)

  const fallback = (
    <table>
      <caption>{title}</caption>
      <thead>
        <tr>
          <th>Range</th>
          <th>Count</th>
        </tr>
      </thead>
      <tbody>
        {binnedData.map((b, i) => (
          <tr key={i}>
            <td>
              {b.x0.toFixed(2)} – {b.x1.toFixed(2)}
            </td>
            <td>{b.count}</td>
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
        if (inner.width <= 0 || binnedData.length === 0) return null

        const xMin = binnedData[0]?.x0 ?? 0
        const xMax = binnedData[binnedData.length - 1]?.x1 ?? 1
        const xScale = linearScale([xMin, xMax], [0, inner.width])
        const yScale = linearScale([0, maxCount || 1], [inner.height, 0])

        const handleEnter = (b: (typeof binnedData)[0], bx: number, by: number) => {
          tooltip.value = {
            x: bx,
            y: by,
            text: `${b.x0.toFixed(2)}–${b.x1.toFixed(2)}: ${b.count}`,
          }
        }
        const handleLeave = () => {
          tooltip.value = null
        }

        return (
          <g transform={`translate(${margins.left},${margins.top})`}>
            {!plain && <GridLines scale={yScale} orientation="y" length={inner.width} />}
            {binnedData.map((b, i) => {
              const rx = xScale.map(b.x0)
              const rw = Math.max(0, xScale.map(b.x1) - rx - 1)
              const ry = yScale.map(b.count)
              const rh = inner.height - ry
              return (
                <rect
                  key={i}
                  x={rx}
                  y={ry}
                  width={rw}
                  height={Math.max(0, rh)}
                  fill="var(--cascade-chart-1)"
                  opacity={0.85}
                  onMouseEnter={() => handleEnter(b, rx + rw / 2, ry)}
                  onMouseLeave={handleLeave}
                  aria-label={`${b.x0.toFixed(1)}–${b.x1.toFixed(1)}: ${b.count}`}
                />
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
            {tooltip.value && (
              <g>
                <rect
                  x={tooltip.value.x - 4}
                  y={tooltip.value.y - 26}
                  width={tooltip.value.text.length * 7 + 8}
                  height={20}
                  fill="var(--cascade-surface-overlay)"
                  rx={3}
                />
                <text
                  x={tooltip.value.x}
                  y={tooltip.value.y - 12}
                  fontSize={12}
                  fill="var(--cascade-text-primary)"
                >
                  {tooltip.value.text}
                </text>
              </g>
            )}
          </g>
        )
      }}
    </ChartFrame>
  )
}
