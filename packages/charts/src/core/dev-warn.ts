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

/** Test-only: clear the dedupe set so a warning can be asserted more than once. */
export function __resetChartWarnings(): void {
  warned.clear()
}
