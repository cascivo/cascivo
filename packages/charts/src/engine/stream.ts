import { stackSeries } from './shape'

export type StreamOffset = 'zero' | 'silhouette'

/**
 * Stacked `[y0, y1]` bands per series with a baseline offset. `zero` is a standard
 * stack; `silhouette` centers each category's stack on a flowing baseline (the
 * classic streamgraph). Dependency-free, built on `stackSeries`.
 */
export function streamLayout(
  values: readonly (readonly number[])[],
  offset: StreamOffset = 'silhouette',
): [number, number][][] {
  const stacked = stackSeries(values)
  if (offset === 'zero') return stacked
  const len = values[0]?.length ?? 0
  const totals = Array.from({ length: len }, (_, i) =>
    values.reduce((sum, v) => sum + (v[i] ?? 0), 0),
  )
  // silhouette: shift each category down by half its total so the stack centers on 0.
  return stacked.map((band) =>
    band.map(([y0, y1], i) => {
      const shift = totals[i]! / 2
      return [y0 - shift, y1 - shift] as [number, number]
    }),
  )
}

/** Min/max y across all bands — for the value-axis domain. */
export function streamExtent(bands: readonly (readonly [number, number])[][]): [number, number] {
  let min = 0
  let max = 0
  for (const band of bands) {
    for (const [y0, y1] of band) {
      min = Math.min(min, y0, y1)
      max = Math.max(max, y0, y1)
    }
  }
  return [min, max]
}
