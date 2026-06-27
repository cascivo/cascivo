/**
 * `encode` — map a 2-D table of rows to the `series`/`data` shape a chart consumes,
 * cascivo's answer to ECharts' `dataset` + `encode`. Pure and dependency-free; the
 * result spreads straight onto a chart: `<LineChart {...encode(rows, {x:'date', y:'v', series:'team'})} />`.
 */
import type { Row } from './transform'

export interface EncodeMapping {
  /** Field for the x value. */
  x: string
  /** Field for the y value. */
  y: string
  /** Optional field whose distinct values split rows into separate series. */
  series?: string
  /** Optional label for the single-series case (default: the `y` field name). */
  label?: string
}

export interface EncodedSeries {
  id: string
  label: string
  data: { x: unknown; y: number }[]
}

export interface EncodedResult {
  series: EncodedSeries[]
  x: (d: { x: unknown; y: number }) => unknown
  y: (d: { x: unknown; y: number }) => number
}

const num = (v: unknown): number => (typeof v === 'number' ? v : Number(v))

/**
 * Encode a flat table into chart-ready series. Without a `series` key the whole table
 * becomes one series; with one, rows are split by that field's distinct values
 * (first-seen order). Missing `x`/`y` fields yield `undefined`/`NaN` rather than throwing.
 */
export function encode(rows: readonly Row[], mapping: EncodeMapping): EncodedResult {
  const x = (d: { x: unknown; y: number }) => d.x
  const y = (d: { x: unknown; y: number }) => d.y

  if (!mapping.series) {
    return {
      series: [
        {
          id: mapping.y,
          label: mapping.label ?? mapping.y,
          data: rows.map((r) => ({ x: r[mapping.x], y: num(r[mapping.y]) })),
        },
      ],
      x,
      y,
    }
  }

  const groups = new Map<string, EncodedSeries>()
  const order: string[] = []
  for (const r of rows) {
    const key = String(r[mapping.series])
    let s = groups.get(key)
    if (!s) {
      s = { id: key, label: key, data: [] }
      groups.set(key, s)
      order.push(key)
    }
    s.data.push({ x: r[mapping.x], y: num(r[mapping.y]) })
  }
  return { series: order.map((k) => groups.get(k)!), x, y }
}

export interface CategoryMapping {
  /** Field for the slice/bar label. */
  category: string
  /** Field for the numeric value. */
  value: string
}

export interface CategoryDatum {
  label: string
  value: number
}

/** Encode a table into `{ label, value }[]` for pie/single-series bar charts. */
export function encodeCategory(rows: readonly Row[], mapping: CategoryMapping): CategoryDatum[] {
  return rows.map((r) => ({ label: String(r[mapping.category]), value: num(r[mapping.value]) }))
}
