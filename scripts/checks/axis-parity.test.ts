/**
 * Axis-parity guard — a chart that draws an axis must expose that axis's formatter.
 *
 * `Axis` has had `format?: (value: number | string | Date) => string` all along. It simply
 * was not threaded onto any chart's own props, so a `LineChart` fed epoch milliseconds — the
 * natural shape for a time series — rendered `1,785,217,000,000` as a tick label, with no
 * way to change it. Passing `Date` objects instead switched to a time scale whose format is
 * fixed, so every bucket narrower than a day collapsed to the same string, which is worse:
 * at least the epoch numbers differed. The 2026-07-28 adopter abandoned `LineChart` for
 * bucketed series entirely (report C16).
 *
 * That is Mechanism D — the capability existed on the primitive and never reached the
 * surface an adopter reads.
 *
 * It is also the workstream's own stated recurrence risk. WS-7 wrote: *"Audit every other
 * chart that renders an `Axis` for the same gap and fix them in one pass — one chart having
 * it and eleven not is how this class of report repeats."* The first implementation pass
 * shipped `format` on `LineChart` and **none of the other seven**. A prose instruction did
 * not survive its own plan; this guard is what survives.
 *
 * The rule: any chart that renders `<Axis … orientation="x">` must accept a `format` prop.
 *
 * Run: `pnpm meta:check`.
 */
import assert from 'node:assert/strict'
import { readFileSync, readdirSync, existsSync } from 'node:fs'
import { join } from 'node:path'
import { describe, it } from 'node:test'

const REPO_ROOT = join(import.meta.dirname, '../..')
const CHARTS_DIR = join(REPO_ROOT, 'packages/charts/src/charts')

/**
 * Charts that draw an x-axis but legitimately cannot take a value formatter, with why.
 *
 * "It was awkward to thread" is not a reason. A chart whose x-axis labels are entirely
 * derived rather than taken from the data is.
 */
const ALLOWLIST: Record<string, string> = {}

interface Chart {
  name: string
  source: string
}

function charts(): Chart[] {
  const out: Chart[] = []
  for (const entry of readdirSync(CHARTS_DIR, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue
    const file = join(CHARTS_DIR, entry.name, `${entry.name}.tsx`)
    if (!existsSync(file)) continue
    out.push({ name: entry.name, source: readFileSync(file, 'utf8') })
  }
  return out
}

/** Does this chart render a horizontal `<Axis>` (as opposed to only grid lines)? */
function drawsXAxis(source: string): boolean {
  return /<Axis\b[\s\S]{0,400}?orientation="x"/.test(source)
}

/** Does its props interface accept a tick formatter? */
function acceptsFormat(source: string): boolean {
  return /^\s{2}format\?:/m.test(source)
}

describe('axis-parity — charts surface the Axis capabilities they compose', () => {
  it('every chart that draws an x-axis accepts a `format` prop', () => {
    const missing = charts()
      .filter((c) => drawsXAxis(c.source) && !acceptsFormat(c.source) && !(c.name in ALLOWLIST))
      .map((c) => c.name)

    assert.deepEqual(
      missing,
      [],
      'These charts render an x-axis but expose no `format` prop, so their tick labels ' +
        'cannot be controlled — a numeric x renders raw (`1,785,217,000,000` for epoch ' +
        'milliseconds) and a Date x gets a fixed format that collapses sub-day buckets ' +
        '(2026-07-28 report C16).\n' +
        '`Axis` already accepts `format`; thread it through:\n' +
        '  format?: (value: number | string | Date) => string\n' +
        '  …\n' +
        '  <Axis scale={xScale} orientation="x" {...(format ? { format } : {})} />\n' +
        `Missing: ${missing.join(', ')}`,
    )
  })

  it('finds the charts it is meant to cover (guards against passing vacuously)', () => {
    const drawing = charts()
      .filter((c) => drawsXAxis(c.source))
      .map((c) => c.name)
    assert.ok(
      drawing.length >= 7,
      `expected at least 7 charts drawing an x-axis, found ${drawing.length}: ${drawing.join(', ')}`,
    )
    for (const expected of ['line-chart', 'bar-chart']) {
      assert.ok(
        drawing.includes(expected),
        `${expected} should be detected as drawing an x-axis; found: ${drawing.join(', ')}`,
      )
    }
  })
})
