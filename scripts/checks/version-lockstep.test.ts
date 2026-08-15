/**
 * The `@cascivo/core`-sharing family versions in lockstep.
 *
 * `@cascivo/react` and `@cascivo/charts` — and five more packages — each depend on
 * `@cascivo/core`. While the family versioned independently on 0.x, an adopter could resolve
 * two `@cascivo/core` ranges that do not overlap, and the package manager would nest a second
 * copy. Because cascivo's reactivity is a **module-level signal registry**, two copies means
 * two registries: a signal written through one is invisible to components subscribed through
 * the other. Nothing errors. Handlers fire and the UI does not move — the hardest cascivo
 * symptom to diagnose, and the one an adopter flagged as the real cost of the version sprawl.
 *
 * `.changeset/config.json`'s `fixed` group makes the whole family release at one version, so
 * the ranges cannot diverge in the first place. `linked` was rejected: it only aligns
 * packages that happen to be bumped in the same release, so drift remains possible, which is
 * precisely the state being fixed.
 *
 * This guard keeps the group honest: **a new package that shares the signal registry must
 * join it.** Without that, the next package added quietly reintroduces the whole problem, and
 * the config would look correct while covering less and less of the family.
 *
 * "Shares the registry" is the rule, not "depends on `@cascivo/core`". Those were the same
 * thing until 2026-08-14, when `@cascivo/i18n` stopped importing `signal` through
 * `@cascivo/core` (whose bundle carries a `'use client'` banner, which crashed RSC — see
 * `rsc-boundary.test.ts`) and took it from `@preact/signals-react` directly. It still holds a
 * module-level signal, so it still must not resolve a second copy; only the edge it holds it
 * through changed. Keying on the dependency alone would have quietly ejected it from the
 * group — or forced a dependency it does not use to be kept for the guard's benefit.
 *
 * `cascivo doctor` also reports an installed duplicate (`checkDuplicateCore`). That stays as
 * defense in depth: lockstep prevents incompatible *ranges*, but a lockfile carried over from
 * an older install can still hold a stale nested copy.
 *
 * Run: `pnpm meta:check`.
 */
import assert from 'node:assert/strict'
import { existsSync, readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import { describe, it } from 'node:test'
import { fileURLToPath } from 'node:url'

const REPO_ROOT = fileURLToPath(new URL('../..', import.meta.url))
const PACKAGES = join(REPO_ROOT, 'packages')

interface PackageJson {
  name?: string
  private?: boolean
  version?: string
  dependencies?: Record<string, string>
  peerDependencies?: Record<string, string>
}

function publishedPackages(): PackageJson[] {
  const out: PackageJson[] = []
  for (const entry of readdirSync(PACKAGES)) {
    const file = join(PACKAGES, entry, 'package.json')
    if (!existsSync(file)) continue
    const pkg = JSON.parse(readFileSync(file, 'utf8')) as PackageJson
    if (pkg.name === undefined || pkg.private === true) continue
    out.push(pkg)
  }
  return out
}

function fixedGroups(): string[][] {
  const cfg = JSON.parse(readFileSync(join(REPO_ROOT, '.changeset/config.json'), 'utf8')) as {
    fixed?: string[][]
    linked?: string[][]
  }
  return cfg.fixed ?? []
}

describe('version-lockstep — the core-sharing family releases as one', () => {
  const packages = publishedPackages()
  const groups = fixedGroups()

  /**
   * Published packages that share the module-level signal registry: `@cascivo/core` itself,
   * anything depending on it, and anything holding `@preact/signals-react` directly (which
   * IS the registry — `@cascivo/core` only re-exports it).
   */
  const family = new Set(
    packages
      .filter(
        (p) =>
          p.name === '@cascivo/core' ||
          p.dependencies?.['@cascivo/core'] !== undefined ||
          p.peerDependencies?.['@preact/signals-react'] !== undefined,
      )
      .map((p) => p.name!),
  )

  it('resolves the family', () => {
    // A resolution bug would make every assertion below pass vacuously.
    assert.ok(family.size >= 5, `only ${family.size} core-sharing package(s) found`)
    assert.ok(family.has('@cascivo/core'), '@cascivo/core itself must be in the family')
    assert.ok(family.has('@cascivo/react'), '@cascivo/react depends on core')
  })

  it('declares exactly one fixed group', () => {
    assert.equal(
      groups.length,
      1,
      'Expected a single `fixed` group in .changeset/config.json covering the core-sharing ' +
        `family; found ${groups.length}.`,
    )
  })

  it('every core-sharing package is in the fixed group', () => {
    const group = new Set(groups[0] ?? [])
    const missing = [...family].filter((n) => !group.has(n)).sort()
    assert.deepEqual(
      missing,
      [],
      'These packages depend on @cascivo/core but are not in the `fixed` group, so they can\n' +
        'drift out of range and resolve a second copy of core — two signal registries, no\n' +
        `error, a UI that silently stops updating:\n  ${missing.join('\n  ')}\n\n` +
        'Add them to `fixed` in .changeset/config.json.',
    )
  })

  it('the fixed group contains nothing that does not share the registry', () => {
    // An unrelated package in the group takes a version bump on every family release for no
    // reason, which makes the churn look arbitrary and invites someone to delete the group.
    const group = groups[0] ?? []
    const extra = group.filter((n) => !family.has(n)).sort()
    assert.deepEqual(
      extra,
      [],
      `These are in the \`fixed\` group but do not depend on @cascivo/core:\n  ${extra.join('\n  ')}`,
    )
  })

  it('names only packages that exist and are published', () => {
    const known = new Set(packages.map((p) => p.name))
    const unknown = (groups[0] ?? []).filter((n) => !known.has(n)).sort()
    assert.deepEqual(
      unknown,
      [],
      `The \`fixed\` group names packages that are absent or private:\n  ${unknown.join('\n  ')}`,
    )
  })
})
