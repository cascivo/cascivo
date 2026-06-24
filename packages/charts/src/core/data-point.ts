/** A single focusable data point for the chart tooltip system.
 * cx/cy are absolute SVG coordinates (already include margin offsets). */
export interface ChartPoint {
  id: string
  /** Absolute SVG x coordinate */
  cx: number
  /** Absolute SVG y coordinate */
  cy: number
  /** Category label or x-axis label */
  label: string
  /** Datum value (y or measure) */
  value: number | string
  seriesId?: string
  /** Share of the whole, 0–100 (pie/donut). Available to a custom formatter. */
  percent?: number
  /** Mark color for this point — used to tint the tooltip text. */
  color?: string
  /** Per-segment breakdown for a stacked category, in layer order. */
  segments?: readonly { label: string; value: number; color?: string }[]
}

export interface TooltipModel {
  /** All focusable points in traversal order */
  points: ChartPoint[]
  /** Custom formatter — defaults to "label: value" */
  format?: (p: ChartPoint) => string
}

export function defaultFormat(p: ChartPoint): string {
  return `${p.label}: ${p.value}`
}
