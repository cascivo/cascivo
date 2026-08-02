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
  height?: number
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
  }: {
    width: number
    height: number
  }): TooltipModel | undefined => {
    if (!tooltip || !hasData) return undefined
    const gap = 2
    const cell = Math.max(2, (w - (weeks - 1) * gap) / weeks)
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
      {({ width }) => {
        const gap = 2
        const cell = Math.max(2, (width - (weeks - 1) * gap) / weeks)
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

/**
 * @deprecated Renamed to `CalendarHeatmap`. `Calendar` collided with `@cascivo/react`'s
 * date-picker `Calendar`: two entries shared one display name with incompatible APIs, so a
 * dashboard importing from both packages silently got whichever one resolved last, and the
 * generated docs for one told adopters to import the other. Kept as an alias for one minor;
 * see `breaking-changes.json`.
 */
export const Calendar = CalendarHeatmap
/** @deprecated Renamed to `CalendarHeatmapProps`. */
export type CalendarProps = CalendarHeatmapProps
/** @deprecated Renamed to `CalendarHeatmapDatum`. */
export type CalendarDatum = CalendarHeatmapDatum
