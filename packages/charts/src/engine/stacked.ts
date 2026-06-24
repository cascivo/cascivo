import type { BarChartSeries } from '../charts/bar-chart/bar-chart'

/** One layer of a stacked bar at a category. */
export interface StackedSegment {
  /** Layer key — becomes the series id/label (e.g. "Done", "In progress"). */
  key: string
  value: number
  /** Optional CSS color for this layer; the first non-undefined per key wins. */
  color?: string
}

/** A single category (bar) with its per-layer segments. */
export interface StackedRow {
  label: string
  segments: readonly StackedSegment[]
}

type StackedDatum = { x: string; y: number }

/**
 * Pivot row-oriented `{ label, segments[] }` data into the column-oriented
 * `BarChartSeries[]` + `x`/`y` accessors that `BarChart` consumes. Spread the
 * result straight into the component:
 *
 * ```tsx
 * <BarChart mode="stacked" {...toStackedSeries(rows)} title="…" />
 * ```
 *
 * - Layer keys are collected in first-seen order across all rows (stable column order).
 * - A key missing from a row contributes 0 so stacks stay aligned.
 * - Each layer's color is the first non-undefined color seen for that key.
 *
 * Pure and dependency-free.
 */
export function toStackedSeries(rows: readonly StackedRow[]): {
  series: BarChartSeries<StackedDatum>[]
  x: (d: StackedDatum) => string
  y: (d: StackedDatum) => number
} {
  // Union of segment keys in first-seen order, with the first color per key.
  const order: string[] = []
  const colorByKey = new Map<string, string | undefined>()
  for (const row of rows) {
    for (const seg of row.segments) {
      if (!colorByKey.has(seg.key)) {
        order.push(seg.key)
        colorByKey.set(seg.key, seg.color)
      } else if (colorByKey.get(seg.key) == null && seg.color != null) {
        colorByKey.set(seg.key, seg.color)
      }
    }
  }

  const series: BarChartSeries<StackedDatum>[] = order.map((key) => {
    const color = colorByKey.get(key)
    return {
      id: key,
      label: key,
      ...(color != null && { color }),
      data: rows.map((row) => ({
        x: row.label,
        y: row.segments.find((s) => s.key === key)?.value ?? 0,
      })),
    }
  })

  return {
    series,
    x: (d) => d.x,
    y: (d) => d.y,
  }
}
