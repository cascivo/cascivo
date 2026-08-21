'use client'
import { useSignals } from '@cascivo/core'
import { ChartFrame } from '../../core/chart-frame'
import { DEFAULT_MARGINS, PLAIN_MARGINS } from '../../core/use-chart'
import { Axis } from '../../chrome/axis'
import { GridLines } from '../../chrome/grid-lines'
import { linearScale } from '../../engine/scale'
import { binValues } from '../../engine/stats'
import type { ChartPoint, TooltipModel } from '../../core/data-point'

export interface HistogramProps {
  data: number[]
  bins?: number
  title: string
  label: string
  description?: string
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
  className?: string
  /**
   * Marks only — no axes, grid lines, or legend. For micro/inline charts.
   *
   * @defaultValue `false`
   * @see the component manifest
   */
  plain?: boolean
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

export function Histogram({
  data,
  bins,
  title,
  label,
  description,
  width: fixedWidth,
  height,
  className,
  plain,
  format,
}: HistogramProps) {
  useSignals()
  // The x-axis title is drawn `titleOffset` (36px) below the axis line, so the default
  // 24px bottom margin would clip it. `label` is required, but an empty string is a legal
  // way to opt out of the caption, and then the extra room would just be dead space.
  const margins = plain
    ? PLAIN_MARGINS
    : label === ''
      ? DEFAULT_MARGINS
      : { ...DEFAULT_MARGINS, bottom: 48 }
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

  const buildTooltip = ({
    width: w,
    height: h,
  }: {
    width: number
    height: number
  }): TooltipModel | undefined => {
    if (binnedData.length === 0) return undefined
    const innerW = w - margins.left - margins.right
    const innerH = h - margins.top - margins.bottom
    const xMin = binnedData[0]?.x0 ?? 0
    const xMax = binnedData[binnedData.length - 1]?.x1 ?? 1
    const xScale = linearScale([xMin, xMax], [0, innerW])
    const yScale = linearScale([0, maxCount || 1], [innerH, 0])

    const points: ChartPoint[] = binnedData.map((b, i) => {
      const rx = xScale.map(b.x0)
      const rw = Math.max(0, xScale.map(b.x1) - rx - 1)
      return {
        id: `bin-${i}`,
        cx: margins.left + rx + rw / 2,
        cy: margins.top + yScale.map(b.count),
        label: `${b.x0.toFixed(2)}–${b.x1.toFixed(2)}`,
        value: b.count,
      }
    })
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
      tooltip={binnedData.length > 0 ? buildTooltip : undefined}
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
                  fill="var(--cascivo-chart-1)"
                  opacity={0.85}
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
                  title={label}
                  {...(format ? { format } : {})}
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
