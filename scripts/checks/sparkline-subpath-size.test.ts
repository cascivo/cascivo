/**
 * `@cascivo/charts/sparkline` stays small — the whole reason it exists.
 *
 * `import { Sparkline } from '@cascivo/charts'` pulls the entire charting engine, because
 * `Sparkline` is built on the same `ChartFrame` as every other chart: tooltips, voronoi
 * hit-testing, a canvas layer, zoom/pan, a toolbox, PNG/SVG export. An adopter measured
 * 44.87 kB / 14.84 kB gzip for one trend line and the docs recorded it as a permanent
 * limitation (2026-08-21 red flag 4). The subpath draws the same chart on `MiniFrame`.
 *
 * A subpath like this has exactly one failure mode: someone adds an import to the lite path
 * — a tooltip, a formatter, a hook that happens to live in the engine — and it silently
 * regains everything it was created to avoid, while every test still passes. So this
 * measures the real built artifact and its whole transitive closure inside `dist/`, and
 * fails on a budget. A subpath that quietly stops being small is worse than no subpath: the
 * docs promise a saving that is no longer there.
 *
 * Requires a prior `pnpm build`.
 */
import { gzipSync } from 'node:zlib'
import { readFileSync, existsSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { strict as assert } from 'node:assert'
import { describe, it } from 'node:test'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..')
const DIST = join(ROOT, 'packages/charts/dist')

/** Budget for the whole transitive closure of the subpath entry, gzipped. */
const BUDGET_GZIP = 6 * 1024

/** Modules the engine owns. If any of these reach the lite path, it is not lite any more. */
const ENGINE_ONLY = ['voronoi', 'Toolbox', 'serializeSvg', 'CanvasLayer', 'zoomWindow']

/** Every `dist/` file reachable from `entry` by static import, including `entry`. */
function closure(entry: string): string[] {
  const seen = new Set<string>()
  const queue = [entry]
  while (queue.length > 0) {
    const file = queue.shift()!
    if (seen.has(file) || !existsSync(file)) continue
    seen.add(file)
    const code = readFileSync(file, 'utf8')
    for (const m of code.matchAll(/from\s*["'](\.[^"']+)["']/g)) {
      const spec = m[1]!
      if (spec.endsWith('.css')) continue
      queue.push(resolve(dirname(file), spec))
    }
  }
  return [...seen]
}

describe('@cascivo/charts/sparkline', () => {
  const entry = join(DIST, 'sparkline.js')

  it('is built (run `pnpm build` first)', () => {
    assert.ok(
      existsSync(entry),
      `${entry} does not exist. This check measures the real artifact, so it needs a build.`,
    )
  })

  it('carries none of the chart engine', () => {
    const code = closure(entry)
      .map((f) => readFileSync(f, 'utf8'))
      .join('\n')
    const found = ENGINE_ONLY.filter((name) => code.includes(name))
    assert.deepEqual(
      found,
      [],
      `The lite sparkline entry now reaches engine-only modules: ${found.join(', ')}. ` +
        'Something imported into the lite path dragged `ChartFrame` back in — the subpath ' +
        'is no longer smaller than the main entry, and the docs still promise it is.',
    )
  })

  it(`fits the ${BUDGET_GZIP / 1024} kB gzip budget`, () => {
    const files = closure(entry)
    const total = files.reduce((sum, f) => sum + gzipSync(readFileSync(f)).length, 0)
    const detail = files
      .map((f) => `${f.slice(DIST.length + 1)}: ${gzipSync(readFileSync(f)).length} B`)
      .join(', ')
    assert.ok(
      total <= BUDGET_GZIP,
      `The subpath's transitive closure is ${total} B gzipped, over the ${BUDGET_GZIP} B ` +
        `budget. Either the addition belongs on the main entry, or the budget needs a ` +
        `deliberate, documented raise. Breakdown: ${detail}`,
    )
  })
})
