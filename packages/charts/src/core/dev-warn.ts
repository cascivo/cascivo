/**
 * Dev-only data guards for charts.
 *
 * Charts already *tolerate* bad data (non-finite y values are dropped from the
 * domain), but they do so silently — which reads as "the chart is wrong" rather
 * than "my data has NaN/Infinity". These helpers surface that once, in dev only.
 *
 * The env check and the O(n) scan run in dev only: `values` is passed as a
 * thunk that is invoked only when not in production, so the argument array is
 * never even built in a production bundle (and this module tree-shakes out
 * under a `NODE_ENV === 'production'` define).
 */

// Bundler-defined global (Vite/Rolldown/webpack all inline `process.env.NODE_ENV`).
declare const process: { env?: { NODE_ENV?: string } } | undefined

function isProd(): boolean {
  return typeof process !== 'undefined' && process?.env?.NODE_ENV === 'production'
}

const warned = new Set<string>()

/**
 * Warn once per `chart` key when the series data contains non-finite numbers.
 * `getValues` is invoked (and the O(n) scan runs) in dev only. Deduped by
 * `chart` so a re-rendering chart does not spam the console.
 */
export function warnNonFinite(chart: string, getValues: () => readonly number[]): void {
  if (isProd()) return
  if (warned.has(chart)) return
  let bad = 0
  for (const v of getValues()) if (!Number.isFinite(v)) bad++
  if (bad === 0) return
  warned.add(chart)
  console.warn(
    `[cascivo charts] ${chart}: ${bad} non-finite value(s) (NaN/Infinity/null) in series data. ` +
      'These are dropped from the chart, which can make it look wrong — check your data source.',
  )
}

/**
 * Warn once per `chart` key with a free-form message. Same dedupe and prod-strip as
 * {@link warnNonFinite}; `key` distinguishes independent warnings from one chart.
 */
export function warnOnce(key: string, message: string): void {
  if (isProd()) return
  if (warned.has(key)) return
  warned.add(key)
  console.warn(`[cascivo charts] ${message}`)
}

/**
 * Warn when two series that share one plot differ so much in magnitude that the smaller
 * one is invisible — the reader then sees a legend naming two metrics over a plot showing
 * one, which is worse than an error because it looks like a working chart.
 */
export function warnScaleMismatch(
  chart: string,
  extents: readonly { label: string; max: number }[],
): void {
  if (isProd()) return
  const finite = extents.filter((e) => Number.isFinite(e.max) && e.max > 0)
  if (finite.length < 2) return
  const sorted = [...finite].sort((a, b) => b.max - a.max)
  const biggest = sorted[0]!
  const smallest = sorted[sorted.length - 1]!
  if (biggest.max / smallest.max < 20) return
  warnOnce(
    `${chart}:scale-mismatch`,
    `${chart}: "${smallest.label}" (max ${smallest.max.toLocaleString()}) is more than 20× smaller than ` +
      `"${biggest.label}" (max ${biggest.max.toLocaleString()}) on the same axis, so it renders as a flat ` +
      'line at the baseline while the legend still names both. Put the smaller series on its own scale ' +
      "with `axis: 'right'` + `secondAxis`, or split it into a second chart.",
  )
}

/**
 * Warn when a dual-axis chart paints two area fills.
 *
 * `warnScaleMismatch` above solves the *scaling* problem it names — it tells you to move the
 * small series to its own axis — and stops there, by design. That leaves a second problem it
 * created: two areas on two scales now cover the same plot area, and their fills composite
 * into a muddy third colour wherever they cross. The 2026-08-21 reporter applied the fix,
 * got correct scaling, and described the result as "legible but not good" (item 7).
 *
 * Dual-axis comparisons are conventionally line-over-area, and `AreaChart` already supports
 * it per series via `type: 'line'` — `solidFillStyle` even excludes line series from the
 * overlap count so the remaining area keeps full opacity. The capability was there and
 * nothing said so.
 *
 * Warn rather than silently switch: changing what an existing chart draws on a minor release
 * is a worse trade than one dev-only line, and the caller may genuinely want two fills.
 */
export function warnDualAxisAreas(chart: string, filled: readonly string[]): void {
  if (isProd()) return
  if (filled.length < 2) return
  const [primary, secondary] = [filled[0]!, filled[filled.length - 1]!]
  warnOnce(
    `${chart}:dual-axis-areas`,
    `${chart}: "${primary}" and "${secondary}" are on different axes but both paint an area ` +
      'fill, so they composite to a third colour wherever they cross. Dual-axis comparisons ' +
      `read as line-over-area: set \`type: 'line'\` on "${secondary}" (the secondary series), ` +
      'or split it into a second chart.',
  )
}

/** Test-only: clear the dedupe set so a warning can be asserted more than once. */
export function __resetChartWarnings(): void {
  warned.clear()
}
