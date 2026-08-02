/**
 * Visual-baseline coverage guard.
 *
 * `apps/site/test/visual.spec.ts` derives one screenshot test per
 * (registry component × theme). The baselines it compares against are committed
 * PNGs, and nothing in the normal PR gate looks at them — so a component added
 * to (or renamed in) `registry.json` without its baselines just rots into a
 * nightly "Visual regression" failure that nobody owns. That is exactly how
 * `layout/stack` → `layout/flex` left three orphaned PNGs behind and turned the
 * nightly red every night from the rename onward.
 *
 * This guard closes that loop at PR time, in both directions:
 *   - every component the spec will screenshot has a baseline for all 3 themes
 *   - every committed baseline still belongs to a component the spec covers
 *
 * Run with: `pnpm visual:baselines:check` (also runs in CI).
 */
import assert from 'node:assert/strict'
import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, it } from 'node:test'

const REPO_ROOT = join(import.meta.dirname, '../..')
const REGISTRY_PATH = join(REPO_ROOT, 'registry.json')
const SPEC_PATH = join(REPO_ROOT, 'apps/site/test/visual.spec.ts')
const SNAPSHOT_DIR = join(REPO_ROOT, 'apps/site/test/snapshots')

/**
 * Playwright flattens a snapshot name into a single path segment, replacing the
 * `/` in a namespaced component (`layout/flex`) with `-`. Mirror that here so
 * expected names match what `toHaveScreenshot()` actually writes.
 */
function baselineName(component: string, theme: string): string {
  return `${component.replaceAll('/', '-')}-${theme}.png`
}

/** Reads a `const NAME = ['a', 'b']` string-array literal out of the spec. */
function readStringArray(source: string, constName: string): string[] {
  const m = new RegExp(`const ${constName}\\b[^=]*=\\s*\\[([^\\]]*)\\]`).exec(source)
  assert.ok(m, `Could not find "const ${constName} = [...]" in visual.spec.ts`)
  return [...m[1]!.matchAll(/'([^']+)'/g)].map((x) => x[1]!)
}

const spec = readFileSync(SPEC_PATH, 'utf8')
const themes = readStringArray(spec, 'THEMES')
const unstablePrefixes = readStringArray(spec, 'UNSTABLE_PREFIXES')

const registry = JSON.parse(readFileSync(REGISTRY_PATH, 'utf8')) as {
  components: { name: string }[]
}
const covered = registry.components
  .map((c) => c.name)
  .filter((name) => !unstablePrefixes.some((prefix) => name.startsWith(prefix)))

const expected = new Set(covered.flatMap((n) => themes.map((t) => baselineName(n, t))))
const actual = new Set(readdirSync(SNAPSHOT_DIR).filter((f) => f.endsWith('.png')))

describe('visual regression baselines', () => {
  it('parses the spec it is guarding', () => {
    assert.ok(themes.length > 0, 'no THEMES parsed from visual.spec.ts')
    assert.ok(covered.length > 0, 'no components left after applying UNSTABLE_PREFIXES')
  })

  it('has a committed baseline for every component × theme', () => {
    const missing = [...expected].filter((f) => !actual.has(f)).sort()
    assert.deepEqual(
      missing,
      [],
      `Missing visual baselines:\n  ${missing.join('\n  ')}\n\n` +
        'Regenerate them on a CI runner (baselines are runner-rendered): run the ' +
        '"Visual regression" workflow via workflow_dispatch with `update: true`.',
    )
  })

  it('has no baselines left over from removed or renamed components', () => {
    const orphaned = [...actual].filter((f) => !expected.has(f)).sort()
    assert.deepEqual(
      orphaned,
      [],
      `Orphaned visual baselines (no matching registry component):\n  ${orphaned.join('\n  ')}\n\n` +
        'Delete them, or rename them if the component was renamed.',
    )
  })
})
