/**
 * APG pattern conformance check.
 *
 * For each component in registry.json that declares accessibility.apgPattern,
 * asserts that:
 *   1. accessibility.role includes at least one of the pattern's requiredRoles
 *   2. accessibility.keyboard includes all of the pattern's requiredKeys
 *
 * Read from registry.json (committed static artifact) to avoid TypeScript
 * workspace resolution issues. Run `pnpm regen` to keep registry in sync.
 */

import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, it } from 'node:test'
import { APG_PATTERNS } from './apg/patterns.ts'

const REPO_ROOT = join(import.meta.dirname, '../..')

interface RegistryAccessibility {
  role: string
  wcag: string
  keyboard: string[]
  apgPattern?: string
}

interface RegistryEntry {
  name: string
  meta?: {
    accessibility?: RegistryAccessibility
  }
}

interface Registry {
  components?: RegistryEntry[]
  charts?: RegistryEntry[]
  layouts?: RegistryEntry[]
  blocks?: RegistryEntry[]
}

function loadRegistry(): RegistryEntry[] {
  const raw = readFileSync(join(REPO_ROOT, 'registry.json'), 'utf8')
  const registry = JSON.parse(raw) as Registry
  return [
    ...(registry.components ?? []),
    ...(registry.charts ?? []),
    ...(registry.layouts ?? []),
    ...(registry.blocks ?? []),
  ]
}

describe('APG pattern conformance', () => {
  it('APG patterns map is well-formed', () => {
    const patternNames = Object.keys(APG_PATTERNS)
    assert.ok(patternNames.length > 0, 'APG_PATTERNS map must not be empty')

    for (const [name, p] of Object.entries(APG_PATTERNS)) {
      assert.ok(p.requiredRoles.length > 0, `${name}: needs at least one requiredRole`)
      assert.match(p.url, /^https?:\/\//, `${name}: needs a valid URL`)
    }
  })

  it('every component with apgPattern conforms to required roles and keys', () => {
    const entries = loadRegistry()
    const withPattern = entries.filter((e) => e.meta?.accessibility?.apgPattern)

    // Collect every violation rather than throwing on the first. This check used to
    // `assert.ok` inside the loop, so a single non-conforming component masked the rest —
    // `collapsible` hid `navigation-menu`, and each fix would have revealed the next one a
    // CI run at a time. A guard you can only make green iteratively is a guard nobody runs.
    const failures: string[] = []

    for (const entry of withPattern) {
      const a11y = entry.meta!.accessibility!
      const patternKey = a11y.apgPattern!
      const pattern = APG_PATTERNS[patternKey]

      if (!pattern) {
        failures.push(
          `${entry.name}: unknown apgPattern '${patternKey}' — add it to ` +
            `scripts/checks/apg/patterns.ts or correct the manifest`,
        )
        continue
      }

      const role = a11y.role
      const keyboard = a11y.keyboard

      // At least one requiredRole must match the component's role string.
      if (!pattern.requiredRoles.some((r) => role === r || role.includes(r))) {
        failures.push(
          `${entry.name} (apgPattern: '${patternKey}'): role '${role}' does not include any of ` +
            `[${pattern.requiredRoles.join(', ')}] — see ${pattern.url}`,
        )
      }

      // Every requiredKey must appear in the keyboard array.
      for (const key of pattern.requiredKeys) {
        if (!keyboard.some((k) => k === key || k.includes(key))) {
          failures.push(
            `${entry.name} (apgPattern: '${patternKey}'): missing required key '${key}' — ` +
              `see ${pattern.url}`,
          )
        }
      }
    }

    assert.deepEqual(
      failures,
      [],
      `APG pattern conformance failures (fix the manifest, or the component if the manifest ` +
        `is right):\n  ${failures.join('\n  ')}`,
    )
  })

  it('no unknown apgPattern keys are silently ignored', () => {
    // Previously an unrecognised pattern key was skipped with a `continue`, so a typo in a
    // manifest disabled the check for that component without a word. Now it's a failure
    // above; this test documents the intent so the `continue` doesn't come back.
    const declared = new Set(
      loadRegistry()
        .map((e) => e.meta?.accessibility?.apgPattern)
        .filter((p): p is string => Boolean(p)),
    )
    const unknown = [...declared].filter((p) => !APG_PATTERNS[p])
    assert.deepEqual(
      unknown,
      [],
      `Manifests declare apgPattern keys with no entry in scripts/checks/apg/patterns.ts: ` +
        `${unknown.join(', ')}`,
    )
  })
})
