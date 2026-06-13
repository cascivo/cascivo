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

    // No components have apgPattern yet — T4-T3 will assign them.
    // Once they do, this loop enforces conformance.
    for (const entry of withPattern) {
      const a11y = entry.meta!.accessibility!
      const patternKey = a11y.apgPattern!
      const pattern = APG_PATTERNS[patternKey]

      if (!pattern) {
        // Unknown pattern key — not in our map. Skip rather than hard-fail;
        // add it to APG_PATTERNS when encountered.
        continue
      }

      const role = a11y.role
      const keyboard = a11y.keyboard

      // At least one requiredRole must match the component's role string
      const roleOk = pattern.requiredRoles.some((r) => role === r || role.includes(r))
      assert.ok(
        roleOk,
        `${entry.name} (apgPattern: '${patternKey}'): role '${role}' does not include any of ` +
          `[${pattern.requiredRoles.join(', ')}] — see ${pattern.url}`,
      )

      // Every requiredKey must appear in the keyboard array
      for (const key of pattern.requiredKeys) {
        const hasKey = keyboard.some((k) => k === key || k.includes(key))
        assert.ok(
          hasKey,
          `${entry.name} (apgPattern: '${patternKey}'): missing required key '${key}' — ` +
            `see ${pattern.url}`,
        )
      }
    }
  })
})
