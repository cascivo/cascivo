/**
 * The published API surface matches the committed snapshot.
 *
 * ## Why
 *
 * From 1.0.0 the public API is covered by semver (`docs/UPGRADING.md`, "The stability
 * contract"). Every other invariant in this repo already has a guard — roughly fifty in
 * `meta:check` alone, plus the RSC boundary walk, the isolated-install canary and the
 * computed-style canary. The API surface itself had none, so a dropped export, a prop that
 * quietly became required, or a narrowed union could reach `main` with every check green.
 * At 1,497 exported names across nine packages, review does not reliably catch that.
 *
 * ## How to respond when this fails
 *
 * A diff is **not** a defect. It is a semver decision:
 *
 *   - a name added                → minor
 *   - an optional prop added      → minor
 *   - a type widened              → minor
 *   - a name removed or renamed   → major, and it must have been deprecated first
 *   - a prop made required        → major
 *   - a type narrowed             → major
 *
 * Classify the change, record it in the changeset, then run `pnpm api:snapshot` and commit
 * `api-surface.json` alongside it. The point is that the decision gets made by a person
 * rather than discovered by an adopter.
 *
 * ## Scope
 *
 * Reads built declarations, so it runs AFTER the build, and skips cleanly when `dist` is
 * absent rather than passing vacuously. Names, kinds and normalized type text only — TSDoc
 * is `dts-tsdoc-parity`'s job, and declaration order is not part of the contract.
 */
import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, it } from 'node:test'
import { fileURLToPath } from 'node:url'
import { buildSnapshot } from '../api-surface/extract.ts'
import type { EntrySurface, Snapshot } from '../api-surface/extract.ts'

const REPO_ROOT = fileURLToPath(new URL('../..', import.meta.url))
const SNAPSHOT_PATH = join(REPO_ROOT, 'api-surface.json')
const BUILT_MARKER = join(REPO_ROOT, 'packages/react/dist/index.d.ts')

/** Flatten to `package|subpath|name` → declaration, so a diff names one thing per line. */
function flatten(snapshot: Snapshot): Map<string, string> {
  const flat = new Map<string, string>()
  for (const [pkg, entries] of Object.entries(snapshot)) {
    for (const [subpath, entry] of Object.entries(entries)) {
      const prefix = `${pkg}${subpath === '.' ? '' : subpath}`
      const surface = entry as EntrySurface
      for (const name of surface.values) flat.set(`${prefix} ${name}`, 'value')
      for (const name of surface.types) flat.set(`${prefix} ${name}`, 'type')
      for (const [name, decl] of Object.entries(surface.declarations)) {
        flat.set(`${prefix} ${name} ::`, JSON.stringify(decl))
      }
    }
  }
  return flat
}

describe('public API surface', () => {
  if (!existsSync(BUILT_MARKER)) {
    it('skipped — packages/react/dist absent (run `pnpm build`)', () => {})
    return
  }

  const built = buildSnapshot(REPO_ROOT)

  it('the extractor finds the surface it is meant to cover (no vacuous pass)', () => {
    const names = Object.values(built)
      .flatMap((entries) => Object.values(entries))
      .reduce((n, e) => n + e.values.length + e.types.length, 0)
    assert.ok(
      names >= 1200,
      `expected 1200+ exported names across the 1.x packages, found ${names} — the ` +
        'extractor has probably gone blind to a declaration form rather than the surface ' +
        'having shrunk by a third',
    )
    assert.ok(Object.keys(built).length >= 9, 'expected all nine 1.x packages')
    // Three shapes that broke earlier revisions: a plain interface, a type alias re-exported
    // with no `type` modifier, and a name imported from core and re-exported.
    const react = built['@cascivo/react']?.['.']
    const charts = built['@cascivo/charts']?.['.']
    const storage = built['@cascivo/storage']?.['.']
    assert.ok(react?.types.includes('ButtonProps'), 'ButtonProps should be a type export')
    assert.ok(charts?.types.includes('SparklineProps'), 'SparklineProps should be a type export')
    assert.ok(
      typeof storage?.declarations['persistedSignal'] === 'string' &&
        storage.declarations['persistedSignal'].startsWith('re-export'),
      'persistedSignal should be recorded as a re-export from @cascivo/core',
    )
  })

  it('matches api-surface.json', () => {
    assert.ok(
      existsSync(SNAPSHOT_PATH),
      'api-surface.json is missing — run `pnpm api:snapshot` and commit it',
    )
    const committed = (JSON.parse(readFileSync(SNAPSHOT_PATH, 'utf8')) as { packages: Snapshot })
      .packages

    const before = flatten(committed)
    const after = flatten(built)

    const removed = [...before.keys()].filter((k) => !after.has(k))
    const added = [...after.keys()].filter((k) => !before.has(k))
    const changed = [...after.keys()].filter((k) => before.has(k) && before.get(k) !== after.get(k))

    const report = (label: string, keys: string[], detail: boolean): string[] =>
      keys.slice(0, 40).map((k) => {
        if (!detail) return `  ${label} ${k}`
        return `  ${label} ${k}\n      committed: ${before.get(k)}\n      built:     ${after.get(k)}`
      })

    const lines = [
      ...report('REMOVED', removed, false),
      ...report('ADDED  ', added, false),
      ...report('CHANGED', changed, true),
    ]
    const extra = removed.length + added.length + changed.length > 120 ? '\n  … and more' : ''

    assert.deepEqual(
      lines,
      [],
      'The built API surface no longer matches api-surface.json.\n\n' +
        'This is a semver decision, not necessarily a bug. Classify it per the table in ' +
        'this file (added name/optional prop/widened type → minor; removed name, prop made ' +
        'required, narrowed type → major, and a removal must have been deprecated first), ' +
        'record it in the changeset, then run `pnpm api:snapshot` and commit the result.\n\n' +
        `${lines.join('\n')}${extra}`,
    )
  })
})
