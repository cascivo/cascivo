/**
 * Recipe channel-column guard (2026-07-25 plan, WS-6 / mechanism B).
 *
 * `docs/RECIPE-DASHBOARD.md` is where an adopter building a dashboard actually reads, and
 * it is hand-written — so it can drift from `registry.json` in either direction. It already
 * did: its prose said the layout primitives are "All exported from `@cascivo/react`" (true)
 * while every generated surface said they were copy-paste only (false). Two hand-maintained
 * answers to one question is the whole defect.
 *
 * Now the recipe carries a **Channel** column, and this guard re-derives it from
 * `registry.json` and compares — so the recipe cannot claim a component ships somewhere it
 * doesn't, and cannot go stale when an entry's channel changes.
 *
 * Run: `pnpm meta:check`.
 */

import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, it } from 'node:test'
import { fileURLToPath } from 'node:url'

const REPO_ROOT = fileURLToPath(new URL('../..', import.meta.url))
const RECIPE = join(REPO_ROOT, 'docs/RECIPE-DASHBOARD.md')

interface Entry {
  name: string
  channels?: string[]
}

function registryByName(): Map<string, Entry> {
  const reg = JSON.parse(readFileSync(join(REPO_ROOT, 'registry.json'), 'utf8')) as {
    components: Entry[]
    blocks?: Entry[]
  }
  return new Map([...reg.components, ...(reg.blocks ?? [])].map((e) => [e.name, e]))
}

/** The Channel cell a row's registry ids imply. Mirrors the generator's labelling. */
function expectedChannel(ids: string[], byName: Map<string, Entry>): string {
  const labels = ids.map((id) => {
    const entry = byName.get(id)
    if (!entry) return null
    const npm = (entry.channels ?? []).find((c) => c.startsWith('npm:'))
    return npm ? `\`${npm.slice(4)}\`` : 'copy-paste'
  })
  const uniq = [...new Set(labels.filter((l): l is string => l !== null))]
  return uniq.length > 0 ? uniq.join(' / ') : '—'
}

describe('RECIPE-DASHBOARD channel column matches registry.json', () => {
  const byName = registryByName()
  const lines = readFileSync(RECIPE, 'utf8').split('\n')

  it('the component map has a Channel column', () => {
    assert.ok(
      lines.some((l) => l.startsWith('| Need | Use | Registry id | Channel | Notes |')),
      'The component map must carry a Channel column — the single most-reported time sink ' +
        'was not being able to tell an importable entry from a copy-paste-only one.',
    )
  })

  it('every row names the channel registry.json actually records', () => {
    const failures: string[] = []
    let inTable = false
    for (const line of lines) {
      if (line.startsWith('| Need | Use | Registry id | Channel |')) {
        inTable = true
        continue
      }
      if (!inTable) continue
      if (!line.startsWith('|')) break
      if (/^\|\s*-+\s*\|/.test(line)) continue
      const cells = line.split('|').slice(1, -1)
      if (cells.length !== 5) continue
      const ids = [...cells[2]!.matchAll(/`([^`]+)`/g)].map((m) => m[1]!)
      if (ids.length === 0) continue
      const unknown = ids.filter((id) => !byName.has(id))
      if (unknown.length > 0) {
        failures.push(`row "${cells[0]!.trim()}": unknown registry id(s) ${unknown.join(', ')}`)
        continue
      }
      const expected = expectedChannel(ids, byName)
      const actual = cells[3]!.trim()
      if (actual !== expected) {
        failures.push(`row "${cells[0]!.trim()}": Channel is "${actual}", expected "${expected}"`)
      }
    }
    assert.deepEqual(
      failures,
      [],
      `docs/RECIPE-DASHBOARD.md's Channel column disagrees with registry.json:\n  ${failures.join('\n  ')}`,
    )
  })
})
