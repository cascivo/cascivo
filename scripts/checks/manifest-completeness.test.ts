/**
 * Manifest-completeness check — the AI layer is only as good as the metas.
 *
 * Asserts over registry.json (i.e. over every registry-source package at
 * once): every entry has intent and examples, and documents its props unless
 * it is explicitly allowlisted as genuinely prop-less. Blocks must carry
 * when-to-use intent too. This is the gate that stops new components from
 * shipping with `examples: []` (15 did) or blocks without intent (12 did).
 */

import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, it } from 'node:test'

const REPO_ROOT = join(import.meta.dirname, '../..')

/** Entries with genuinely no public props (verified against source). */
const PROPLESS: Record<string, string> = {
  'block/console-app': 'zero-argument demo composition',
  'block/page-with-breadcrumb': 'zero-argument demo composition',
  'block/sidebar-app': 'zero-argument demo composition',
}

interface Entry {
  name: string
  type?: string
  meta?: {
    props?: unknown[]
    examples?: unknown[]
    intent?: { whenToUse?: string[]; whenNotToUse?: string[] }
  }
}

interface Block {
  name: string
  intent?: { whenToUse?: string[]; whenNotToUse?: string[] }
}

describe('manifest completeness — agents get real machine-readable guidance', () => {
  const registry = JSON.parse(readFileSync(join(REPO_ROOT, 'registry.json'), 'utf8')) as {
    components: Entry[]
    blocks?: Block[]
  }

  it('every registry entry has intent and at least one example', () => {
    const missing: string[] = []
    for (const c of registry.components) {
      if (!c.meta?.intent?.whenToUse?.length) missing.push(`${c.name}: intent.whenToUse empty`)
      if (!c.meta?.examples?.length) missing.push(`${c.name}: examples empty`)
    }
    assert.deepEqual(missing, [], `Manifest holes:\n  ${missing.join('\n  ')}`)
  })

  it('every registry entry documents its props (or is allowlisted prop-less)', () => {
    const missing = registry.components
      .filter((c) => !c.meta?.props?.length && PROPLESS[c.name] === undefined)
      .map((c) => c.name)
    assert.deepEqual(
      missing,
      [],
      `Entries with empty props — document them or allowlist with a reason: ${missing.join(', ')}`,
    )
  })

  it('every block carries when-to-use intent', () => {
    const missing = (registry.blocks ?? [])
      .filter((b) => !b.intent?.whenToUse?.length || !b.intent?.whenNotToUse?.length)
      .map((b) => b.name)
    assert.deepEqual(missing, [], `Blocks without intent: ${missing.join(', ')}`)
  })

  it('prop-less allowlist has no stale entries', () => {
    const names = new Set(registry.components.map((c) => c.name))
    const stale = Object.keys(PROPLESS).filter(
      (name) =>
        !names.has(name) ||
        (registry.components.find((c) => c.name === name)?.meta?.props?.length ?? 0) > 0,
    )
    assert.deepEqual(stale, [], `Stale PROPLESS entries: ${stale.join(', ')}`)
  })
})
