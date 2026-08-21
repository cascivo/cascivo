/**
 * `@cascivo/charts/sparkline` — one chart, none of the engine.
 *
 * `import { Sparkline } from '@cascivo/charts'` pulls in the whole charting engine
 * (tooltips, voronoi hit-testing, canvas, zoom/pan, toolbox, PNG/SVG export) because
 * `Sparkline` is built on the same `ChartFrame` as every other chart — an adopter measured
 * 44.87 kB / 14.84 kB gzip for one trend line on a marketing page (2026-08-21 red flag 4).
 *
 * This entry draws the identical chart on a minimal frame instead. **The one behavioural
 * difference: no hover tooltip.** The tooltip is what requires the engine, and a page that
 * reaches for this entry has already decided it does not want the engine. Everything else —
 * markup, classes, tokens, the required accessible name — is the same, and
 * `sparkline-parity.test.tsx` asserts the rendered SVG matches.
 *
 * Use the main entry when you want the tooltip, or when the page draws other charts anyway
 * (the engine is then already paid for and this entry saves nothing).
 */
export { Sparkline } from './charts/sparkline/sparkline-lite'
export type { SparklineLiteProps as SparklineProps } from './charts/sparkline/sparkline-lite'
