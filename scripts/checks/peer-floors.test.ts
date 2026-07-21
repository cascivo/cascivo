/**
 * Peer-floor check — every published (`private !== true`) package that peer-depends
 * on `@preact/signals-react` must floor it at `>=3.0.0`.
 *
 * React 19 removed the internal that signals-react 2.x imports, so a 2.x runtime
 * fails to load under React 19 (`SyntaxError: … '__SECRET_INTERNALS…'`). A floor of
 * `>=2.0.0` admitted that broken install; a TanStack Start adopter hit it (2026-07-20).
 * This check prevents any single package's floor from silently regressing.
 */

import assert from 'node:assert/strict'
import { readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import { describe, it } from 'node:test'

const REPO_ROOT = join(import.meta.dirname, '../..')
const PACKAGES_DIR = join(REPO_ROOT, 'packages')
const SIGNALS = '@preact/signals-react'
const REQUIRED_FLOOR = '>=3.0.0'

interface PkgJson {
  name?: string
  private?: boolean
  peerDependencies?: Record<string, string>
}

function packagesWithSignalsPeer(): { name: string; floor: string }[] {
  const out: { name: string; floor: string }[] = []
  for (const dir of readdirSync(PACKAGES_DIR)) {
    let pkg: PkgJson
    try {
      pkg = JSON.parse(readFileSync(join(PACKAGES_DIR, dir, 'package.json'), 'utf8')) as PkgJson
    } catch {
      continue
    }
    if (pkg.private === true) continue
    const floor = pkg.peerDependencies?.[SIGNALS]
    if (typeof floor === 'string') out.push({ name: pkg.name ?? dir, floor })
  }
  return out
}

describe('peer-floors — signals-react floored at 3.x', () => {
  it(`every published package flooring ${SIGNALS} requires ${REQUIRED_FLOOR}`, () => {
    const offenders = packagesWithSignalsPeer().filter((p) => p.floor !== REQUIRED_FLOOR)
    assert.deepEqual(
      offenders.map((o) => `${o.name} (${o.floor})`),
      [],
      `These packages declare a ${SIGNALS} peer floor other than ${REQUIRED_FLOOR}; React 19 ` +
        `needs signals-react 3.x. Offenders: ${offenders.map((o) => o.name).join(', ')}`,
    )
  })

  it('finds the expected set of signals-peered packages (guards against silent skips)', () => {
    // Published only — `@cascivo/render` also peers signals but is private.
    const count = packagesWithSignalsPeer().length
    assert.ok(count >= 8, `expected at least 8 published packages peer-depending on ${SIGNALS}, found ${count}`)
  })
})
