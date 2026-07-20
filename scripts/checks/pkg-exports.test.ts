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

  it('finds the expected set of published packages (guards against silent skips)', () => {
    // A floor, not an exact match — new published packages only raise this number.
    const count = publishedPackagesWithExports().length
    assert.ok(
      count >= 14,
      `expected at least 14 published packages with exports maps, found ${count}`,
    )
  })
})
