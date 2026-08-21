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

/**
 * A two-value enum whose description names neither value.
 *
 * `DataList.orientation` was documented as "Layout orientation of the component." — true of
 * the words and useless about the fact, because the ambiguity is exactly *what* is being
 * oriented. `'vertical'` moves the value under its label; the items stack vertically either
 * way. An adopter read it the other way round and got a very tall summary card (2026-08-21
 * report item 9).
 *
 * A description that names neither member of a two-member union is almost always that
 * failure: it restates the prop name. Naming even one member forces the sentence to say what
 * the axis actually is — "`horizontal` puts them side by side" cannot be written without
 * committing to what moves.
 *
 * This is the narrow, checkable half of the same rule `PLACEHOLDERS` in
 * `tsdoc-parity.test.ts` enforces by exact string. That list catches a known boilerplate
 * sentence anywhere; this catches a new one on the props where the ambiguity bites hardest.
 *
 * When it first ran it flagged 19 props — every one of them genuinely uninformative. They
 * were rewritten rather than allowlisted, which is why `OBVIOUS` is empty and should stay
 * that way: an allowlist here is a description someone decided not to write.
 */
describe('two-value enums say what their values mean', () => {
  const registry = JSON.parse(readFileSync(join(REPO_ROOT, 'registry.json'), 'utf8')) as {
    components: Entry[]
  }
  const UNION_OF_TWO = /^'([a-z-]+)' \| '([a-z-]+)'$/

  /** Props whose two values genuinely need no gloss, with the reason. Empty on purpose. */
  const OBVIOUS: Record<string, string> = {}

  it('names at least one of its two values', () => {
    const offenders: string[] = []
    for (const c of registry.components) {
      for (const p of c.meta?.props ?? []) {
        const m = UNION_OF_TWO.exec(p.type ?? '')
        if (!m) continue
        const key = `${c.name}.${p.name}`
        if (key in OBVIOUS) continue
        const description = (p.description ?? '').toLowerCase()
        if (description.includes(m[1]!) || description.includes(m[2]!)) continue
        offenders.push(`${key}: "${p.description ?? ''}"`)
      }
    }
    assert.deepEqual(
      offenders,
      [],
      'These props are a choice between two named values, and the description names neither — ' +
        'so it restates the prop name instead of saying what changes. Say what each value ' +
        'does; a reader cannot tell which way the axis runs from the word "orientation":\n  ' +
        offenders.join('\n  '),
    )
  })
})
