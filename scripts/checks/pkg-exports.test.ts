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
   * One module-file convention across the family.
   *
   * `@cascivo/core`, `@cascivo/i18n`, `@cascivo/storage` and `@cascivo/icons` emitted
   * `.mjs`/`.d.mts` (they built with `vp pack`) while `@cascivo/react`, `@cascivo/charts`,
   * `@cascivo/flow`, `@cascivo/editor` and `@cascivo/ai` emitted `.js`/`.d.ts`. The
   * 2026-07-28 reporter named it C8: "harmless, but it breaks tooling that assumes one
   * convention across a package family." Every package is `"type": "module"`, so `.js` is
   * already unambiguous.
   *
   * **The first convergence attempt broke Next.js RSC prerendering and was reverted.** The
   * cause turned out to be neither `vp build` nor the single-file output: `packages/core`
   * already carried a `build.lib` block whose `external` list used EXACT STRINGS
   * (`'@preact/signals-react'`). `vp pack` ignores that block, so it was inert for years.
   * The moment core built with `vp build`, the list took effect — and an exact string does
   * not match `@preact/signals-react/runtime`, so that subpath got bundled along with its
   * CJS `use-sync-external-store` shim, whose `require("react")` is what Turbopack rejected.
   *
   * Fix: subpath-aware regex externals, plus a `'use client'` banner (the bundler collapses
   * 23 directive-carrying modules into one entry and drops per-module directives). All four
   * packages are converged and `apps/examples/react-next` prerenders. The lesson worth
   * keeping: an inert config block is not a safe config block.
   */
  it('every published package emits .js/.d.ts, not .mjs/.d.mts', () => {
    // Tool packages an adopter RUNS (npx) rather than imports, plus the build-time vite
    // plugin. The convention matters for anything landing in a consumer's module graph; a
    // CLI binary's own extension does not.
    const NOT_IMPORTED = new Set([
      'cascivo',
      '@cascivo/mcp',
      '@cascivo/registry',
      '@cascivo/vite-plugin',
    ])
    const offenders: string[] = []
    for (const p of publishedPackagesWithExports()) {
      if (NOT_IMPORTED.has(p.name)) continue
      for (const [subpath, target] of Object.entries(p.exports)) {
        const targets =
          typeof target === 'string' ? [target] : Object.values(target as Record<string, string>)
        for (const t of targets) {
          if (typeof t === 'string' && /\.(mjs|d\.mts)$/.test(t)) {
            offenders.push(`${p.name} ${subpath} -> ${t}`)
          }
        }
      }
    }
    assert.deepEqual(
      offenders,
      [],
      'These published packages emit `.mjs`/`.d.mts` while the rest of the family emits ' +
        '`.js`/`.d.ts`. Build with `vp build` + `scripts/flatten-types.mjs` (see ' +
        '`packages/flow`), and make the `external` list SUBPATH-AWARE (regexes, not exact ' +
        'strings) or a CJS subpath will be bundled and break Next.js RSC — see the comment ' +
        `above.\nOffenders:\n  ${offenders.join('\n  ')}`,
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
