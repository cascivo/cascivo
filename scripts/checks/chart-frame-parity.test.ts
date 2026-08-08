/**
 * Chart responsive-doc parity — a shared prop doc must be true of the component carrying it.
 *
 * Every chart's `width` prop carries the same TSDoc boilerplate: *"Omit for a responsive
 * chart — the chart fills and tracks its container via a ResizeObserver."* It is
 * copy-pasted across 25 components, and on `Meter` it was simply false: hard-coded
 * `width = 200`, no `viewBox`, no `ResizeObserver`, no container tracking of any kind. An
 * adopter following the doc got a 200px meter in a full-width card.
 *
 * ## Why it checks the claim and not the shape
 *
 * The obvious rule — "must import `ChartFrame`" — would be a shape check, and shape checks
 * decay. `Meter` legitimately does not use `ChartFrame`: it has no data points, so the
 * frame's tooltip, zoom, toolbox and keyboard-traversal machinery are dead weight, and its
 * `role="meter"` semantics are not the `role="img"` a frame gives an SVG. Requiring the
 * import would have forced a worse component or an allowlist entry.
 *
 * What the doc actually promises is *container tracking*, and the one thing that delivers
 * it is `useChartSize`. So: **if a chart's `width` doc claims responsiveness, that chart
 * must reach `useChartSize`** — directly, or through `ChartFrame`, which calls it.
 *
 * This is the `ref-parity` lesson applied up front: that guard asserted the `forwardRef`
 * wrapper existed and never that the ref reached an element, and a component sat in its
 * "compliant" list for months while dropping every ref on the floor.
 *
 * Run: `pnpm meta:check`.
 */
import assert from 'node:assert/strict'
import { existsSync, readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import { describe, it } from 'node:test'
import { fileURLToPath } from 'node:url'

const REPO_ROOT = fileURLToPath(new URL('../..', import.meta.url))
const CHARTS = join(REPO_ROOT, 'packages/charts/src/charts')

/** The distinctive phrase of the shared responsive-width boilerplate. */
const RESPONSIVE_CLAIM = /fills and tracks\s+\*?\s*its container/

interface Chart {
  name: string
  source: string
}

function charts(): Chart[] {
  const out: Chart[] = []
  for (const entry of readdirSync(CHARTS, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue
    const file = join(CHARTS, entry.name, `${entry.name}.tsx`)
    if (!existsSync(file)) continue
    out.push({ name: entry.name, source: readFileSync(file, 'utf8') })
  }
  return out
}

const all = charts()
const claiming = all.filter((c) => RESPONSIVE_CLAIM.test(c.source))

describe('chart-frame-parity — a responsive-width doc means the chart really tracks its container', () => {
  it('finds the chart catalogue and the shared claim (guards against passing vacuously)', () => {
    assert.ok(all.length >= 20, `expected 20+ charts, found ${all.length}`)
    assert.ok(
      claiming.length >= 15,
      `expected the responsive-width boilerplate on most charts, found ${claiming.length}. ` +
        'If the wording changed, update RESPONSIVE_CLAIM — do not let this guard go quiet.',
    )
  })

  for (const chart of claiming) {
    it(`${chart.name} reaches useChartSize`, () => {
      const tracks = /\buseChartSize\b/.test(chart.source) || /\bChartFrame\b/.test(chart.source)
      assert.ok(
        tracks,
        `${chart.name}.tsx documents its \`width\` prop as container-tracking but never ` +
          'reaches `useChartSize` (directly or via `ChartFrame`), so the doc is false. ' +
          'Either make it track the container, or delete the boilerplate from that prop.',
      )
    })

    it(`${chart.name} has no hard-coded width default contradicting the doc`, () => {
      // `width = 200` in the destructure makes the prop's default a fixed pixel size, which
      // is the opposite of what "omit for a responsive chart" tells the reader to do.
      const hardDefault = /\bwidth\s*=\s*\d+\s*,/.exec(chart.source)
      assert.equal(
        hardDefault,
        null,
        `${chart.name}.tsx destructures \`${hardDefault?.[0].trim()}\` — omitting \`width\` ` +
          'then yields a FIXED size, while its own doc says omitting it makes the chart ' +
          'responsive. Seed the size inside useChartSize instead.',
      )
    })
  }

  it('every chart drawing an SVG gives it a viewBox so it can scale', () => {
    const missing = claiming
      .filter((c) => /<svg\b/.test(c.source))
      .filter((c) => !/viewBox=/.test(c.source))
      .map((c) => c.name)
    assert.deepEqual(
      missing,
      [],
      `These render a raw <svg> with no viewBox, so it cannot scale down to its container ` +
        `no matter what CSS says: ${missing.join(', ')}`,
    )
  })
})
