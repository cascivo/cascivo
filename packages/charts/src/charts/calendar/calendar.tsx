'use client'
import { useSignal, useSignals } from '@cascivo/core'
import { ChartFrame } from '../../core/chart-frame'
import { VisualMap, mapVisual, visualVisible, type VisualMapOptions } from '../../chrome/visual-map'
import type { ChartPoint, TooltipModel } from '../../core/data-point'

export interface CalendarHeatmapDatum {
  day: string | Date
  value: number
}

export interface CalendarHeatmapProps {
  data: readonly CalendarHeatmapDatum[]
  title: string
  description?: string
  /** Range start/end (ISO string or Date). Defaults to the data's min/max day. */
  from?: string | Date
  to?: string | Date
  /**
   * Fixed SVG width in px. ⚠ **Omit for a responsive chart** — the chart fills and tracks
   * its container via a ResizeObserver; there is no correct pixel number in a responsive
   * grid. A fixed width is clamped to the container (max-inline-size: 100%) so it can never
   * overflow its card, but it also stops the chart growing. `useChartSize` is NOT needed for
   * this — charts call it internally.
   * @see the component manifest
   */
  width?: number
  /**
   * SVG height in px. A **cap on the drawn grid, never a crop** — cells shrink so all seven
   * weekday rows fit inside it.
   *
   * @defaultValue `160` (`48` when `plain`)
   * @see the component manifest
   */
  height?: number
  /**
   * Optional ceiling on a cell's edge, in px. Cells are already clamped to fit `height`; use
   * this only to keep them small in a short, wide range (GitHub's calendar uses ~11).
   *
   * Omitted by default so the height budget alone decides — a fixed default would shrink
   * year-length ranges that render correctly today.
   */
  maxCellSize?: number
  tooltip?: boolean
  className?: string
  /**
   * When true, renders a minimal variant without chart chrome.
   *
   * @defaultValue `false`
   * @see the component manifest
   */
  plain?: boolean
  /** Map day value → CVD-safe colour via a continuous/piecewise legend that filters the range. */
  visualMap?: VisualMapOptions
}

const MS_DAY = 86_400_000

/** Gap between cells, px. */
const GAP = 2
/** Weekday rows in a calendar heatmap. Always seven. */
const ROWS = 7

/**
 * Cell edge for a container, in px.
 *
 * ## Why the height term exists
 *
 * The shipped formula was `(width - (weeks - 1) * GAP) / weeks` — width only. Height was a
 * constant (160) that never consulted it, so the two were unrelated numbers and the grid
 * overflowed whenever `width / weeks` exceeded the row budget. 119 days in a 1054px card
 * produced 59px cells: 434px of grid inside a 160px viewBox, with rows 3-7 simply cut off and
 * nothing logged. The output reads as "this heatmap has three rows of data", which is
 * plausible enough to ship (2026-08-22 report item 11).
 *
 * Clamping to the height budget makes clipping unrepresentable, and it is exactly the right
 * cap rather than a conservative one: `byWidth > byHeight` is equivalent to "seven rows do not
 * fit", so this changes the rendering **if and only if** that rendering is currently clipped.
 * A year-length range (17.9px cells at 1054px) is untouched.
 *
 * The `+ 1` in the height term is not slack: rects are drawn `cell - 1` tall, so the deepest
 * drawn edge is `ROWS * cell + (ROWS - 1) * GAP - 1`. Dropping it makes the cap one pixel
 * conservative, which shrinks a 180-day range at 600px that fits correctly today.
 */
function cellSize(width: number, height: number, weeks: number, maxCellSize?: number): number {
  const byWidth = (width - (weeks - 1) * GAP) / weeks
  const byHeight = (height - (ROWS - 1) * GAP + 1) / ROWS
  const cap = maxCellSize === undefined ? byHeight : Math.min(byHeight, maxCellSize)
  return Math.max(2, Math.min(byWidth, cap))
}
const toDate = (d: string | Date) => (d instanceof Date ? d : new Date(d))
const iso = (d: Date) => d.toISOString().slice(0, 10)
/** Sunday-based start of the week containing d (UTC). */
function weekStart(d: Date): Date {
  const x = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()))
  x.setUTCDate(x.getUTCDate() - x.getUTCDay())
  return x
}

/** A calendar heatmap — a week-column grid of day cells colored by value. */
export function CalendarHeatmap({
  data,
  title,
  description,
  from,
  to,
  width: fixedWidth,
  height,
  maxCellSize,
  tooltip,
  className,
  plain,
  visualMap,
}: CalendarHeatmapProps) {
  useSignals()
  const hasData = data.length > 0
  const vmRange = useSignal<[number, number]>([visualMap?.min ?? 0, visualMap?.max ?? 1])
  const vmHidden = useSignal(new Set<number>())

  const byDay = new Map<string, number>()
  for (const d of data) byDay.set(iso(toDate(d.day)), d.value)
  const days = data.map((d) => toDate(d.day))
  const start = weekStart(
    from ? toDate(from) : days.reduce((a, b) => (b < a ? b : a), days[0] ?? new Date()),
  )
  const end = to ? toDate(to) : days.reduce((a, b) => (b > a ? b : a), days[0] ?? new Date())
  const weeks = hasData ? Math.max(1, Math.ceil((end.getTime() - start.getTime()) / MS_DAY / 7)) : 1
  const maxValue = Math.max(1, ...data.map((d) => d.value))

  const resolvedHeight = height ?? (plain ? 48 : 160)

  const cells: { col: number; row: number; date: Date; value: number }[] = []
  for (let w = 0; w < weeks; w++) {
    for (let r = 0; r < 7; r++) {
      const date = new Date(start.getTime() + (w * 7 + r) * MS_DAY)
      if (date > end) continue
      cells.push({ col: w, row: r, date, value: byDay.get(iso(date)) ?? 0 })
    }
  }

  const fallback = (
    <table>
      <caption>{title}</caption>
      <thead>
        <tr>
          <th>Day</th>
          <th>Value</th>
        </tr>
      </thead>
      <tbody>
        {data.map((d, i) => (
          <tr key={i}>
            <td>{iso(toDate(d.day))}</td>
            <td>{d.value}</td>
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
    const gap = GAP
    const cell = cellSize(w, h, weeks, maxCellSize)
    const points: ChartPoint[] = cells.map((c, i) => ({
      id: `${iso(c.date)}-${i}`,
      cx: c.col * (cell + gap) + cell / 2,
      cy: c.row * (cell + gap) + cell / 2,
      label: iso(c.date),
      value: c.value,
    }))
    return { points, format: (p) => `${p.label}: ${p.value}` }
  }

  const frame = (
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
      {({ width, height: innerHeight }) => {
        const gap = GAP
        const cell = cellSize(width, innerHeight, weeks, maxCellSize)
        return (
          <g>
            {cells.map((c, i) => {
              const vmFill = visualMap ? mapVisual(c.value, visualMap).color : undefined
              const visible = visualMap
                ? visualVisible(c.value, visualMap, vmRange.value, vmHidden.value)
                : true
              return (
                <rect
                  key={i}
                  x={c.col * (cell + gap)}
                  y={c.row * (cell + gap)}
                  width={cell - 1}
                  height={cell - 1}
                  rx={1.5}
                  fill={vmFill ?? 'var(--cascivo-chart-2)'}
                  fillOpacity={
                    visualMap
                      ? c.value > 0 && visible
                        ? 1
                        : 0.08
                      : c.value > 0
                        ? 0.15 + 0.85 * (c.value / maxValue)
                        : 0.06
                  }
                  data-day={iso(c.date)}
                />
              )
            })}
          </g>
        )
      }}
    </ChartFrame>
  )

  if (!visualMap || !hasData) return frame

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
      {frame}
      <VisualMap options={visualMap} range={vmRange} hidden={vmHidden} label={title} />
    </div>
  )
}
