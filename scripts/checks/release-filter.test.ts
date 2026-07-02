/**
 * Release-filter check.
 *
 * `pnpm release` runs `build:release && changeset publish`. Changesets
 * publishes every non-private package, so every non-private package MUST be
 * built by the `build:release` filter — otherwise it publishes with a stale
 * or missing dist/ (this happened to @cascivo/flow).
 */

import assert from 'node:assert/strict'
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { describe, it } from 'node:test'

const REPO_ROOT = join(import.meta.dirname, '../..')

describe('release-filter check — build:release covers every published package', () => {
  it('every non-private package appears as a -F filter in build:release', () => {
    const rootPkg = JSON.parse(readFileSync(join(REPO_ROOT, 'package.json'), 'utf8')) as {
      scripts: Record<string, string>
    }
    const buildRelease = rootPkg.scripts['build:release'] ?? ''
    assert.ok(buildRelease.length > 0, 'root package.json has no build:release script')

    const missing: string[] = []
    const packagesDir = join(REPO_ROOT, 'packages')
    for (const entry of readdirSync(packagesDir)) {
      const pkgPath = join(packagesDir, entry, 'package.json')
      try {
        if (!statSync(pkgPath).isFile()) continue
      } catch {
        continue
      }
      const pkg = JSON.parse(readFileSync(pkgPath, 'utf8')) as {
        name: string
        private?: boolean
      }
      if (pkg.private === true) continue
      if (!new RegExp(`-F ${pkg.name}(\\s|$)`).test(buildRelease)) {
        missing.push(pkg.name)
      }
    }

    assert.deepEqual(
      missing,
      [],
      `Published packages missing from build:release (would publish without a fresh dist/): ${missing.join(', ')}`,
    )
  })
})
