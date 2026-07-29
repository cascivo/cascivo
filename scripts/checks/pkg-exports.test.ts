/**
 * Package-exports check — every published (`private !== true`) package that has an
 * `exports` map must expose `"./package.json": "./package.json"`.
 *
 * Without it, `require.resolve('@cascivo/<pkg>/package.json')` throws
 * `ERR_PACKAGE_PATH_NOT_EXPORTED`, which breaks version probes, bundler plugins, and
 * inspection tooling. Only `@cascivo/react` shipped it before this check; the
 * inconsistency was reported by a TanStack Start adopter (2026-07-18).
 */

import assert from 'node:assert/strict'
import { readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import { describe, it } from 'node:test'

const REPO_ROOT = join(import.meta.dirname, '../..')
const PACKAGES_DIR = join(REPO_ROOT, 'packages')

interface PkgJson {
  name?: string
  private?: boolean
  exports?: Record<string, unknown>
}

function publishedPackagesWithExports(): {
  name: string
  path: string
  exports: Record<string, unknown>
}[] {
  const out: { name: string; path: string; exports: Record<string, unknown> }[] = []
  for (const dir of readdirSync(PACKAGES_DIR)) {
    const pkgPath = join(PACKAGES_DIR, dir, 'package.json')
    let pkg: PkgJson
    try {
      pkg = JSON.parse(readFileSync(pkgPath, 'utf8')) as PkgJson
    } catch {
      continue // no package.json in this dir
    }
    if (pkg.private === true) continue
    if (!pkg.exports || typeof pkg.exports !== 'object') continue
    out.push({ name: pkg.name ?? dir, path: pkgPath, exports: pkg.exports })
  }
  return out
}

describe('pkg-exports — published packages expose ./package.json', () => {
  it('every published package with an exports map exports ./package.json', () => {
    const offenders: string[] = []
    for (const p of publishedPackagesWithExports()) {
      if (p.exports['./package.json'] !== './package.json') {
        offenders.push(p.name)
      }
    }
    assert.deepEqual(
      offenders,
      [],
      `These published packages are missing \`"./package.json": "./package.json"\` in their ` +
        `exports map (breaks require.resolve('<pkg>/package.json')): ${offenders.join(', ')}`,
    )
  })

  /**
   * Module-file convention across the family — RECORDED, NOT ENFORCED.
   *
   * `@cascivo/icons`, `@cascivo/core`, `@cascivo/i18n`, `@cascivo/storage` and the tool
   * packages emit `.mjs`/`.d.mts` (they build with `vp pack`) while `@cascivo/react`,
   * `@cascivo/charts`, `@cascivo/flow`, `@cascivo/editor` and `@cascivo/ai` emit
   * `.js`/`.d.ts`. The 2026-07-28 reporter called it out as C8: "harmless, but it breaks
   * tooling that assumes one convention across a package family."
   *
   * **Converging it was attempted and reverted.** Rebuilding `core`/`i18n`/`storage`/`icons`
   * with an explicit `vp build` lib config produces a single-file bundle instead of
   * `vp pack`'s output, and that broke Next.js RSC prerendering in
   * `apps/examples/react-next` — `ReferenceError: p is not defined` from a `forwardRef`
   * binding lost when Turbopack re-bundles the collapsed chunk. `'use client'` banners and
   * subpath-aware externals were both tried and neither fixed it.
   *
   * So the divergence stands, deliberately: it is cosmetic, and the alternative is a broken
   * RSC build for every Next.js adopter. The assertion is left here as a **record of the
   * attempt** rather than a gate, so the next person does not pay for the same experiment.
   * If you want to retry, start from why Turbopack drops that binding.
   *
   * `@cascivo/ai` IS converged (it moved to `vp build` for the CSS-import-edge plugin and
   * builds clean), which shows the conversion is not universally unsafe — only unsafe for
   * packages Next re-bundles through `@cascivo/react`.
   */
  it('records which published packages emit .mjs (informational, see the comment above)', () => {
    const mjs = publishedPackagesWithExports()
      .filter((p) =>
        Object.values(p.exports).some((target) => {
          const targets =
            typeof target === 'string' ? [target] : Object.values(target as Record<string, string>)
          return targets.some((t) => typeof t === 'string' && /\.(mjs|d\.mts)$/.test(t))
        }),
      )
      .map((p) => p.name)
      .sort()

    // A floor on what is known-diverged. If this SHRINKS, someone converged a package —
    // update the list and the comment above. If it GROWS, a new package picked the minority
    // convention and should have picked `.js`/`.d.ts` instead.
    assert.deepEqual(
      mjs,
      [
        '@cascivo/core',
        '@cascivo/i18n',
        '@cascivo/icons',
        '@cascivo/mcp',
        '@cascivo/registry',
        '@cascivo/storage',
        '@cascivo/vite-plugin',
        'cascivo',
      ],
      'The set of packages emitting .mjs/.d.mts changed. New packages should emit ' +
        '.js/.d.ts (build with `vp build` + scripts/flatten-types.mjs, see packages/flow). ' +
        'If you converged one of the listed packages, verify apps/examples/react-next still ' +
        'prerenders — that is what blocked the last attempt — then update this list.',
    )
  })

  it('finds the expected set of published packages (guards against silent skips)', () => {
    // A floor, not an exact match — new published packages only raise this number.
    const count = publishedPackagesWithExports().length
    assert.ok(
      count >= 14,
      `expected at least 14 published packages with exports maps, found ${count}`,
    )
  })
})
