/**
 * Meta-coverage check — every `<name>.meta.ts` on disk must be a registry
 * entry (or be explicitly excluded here with a reason). A manifest that isn't
 * registered is invisible to the CLI, the MCP server, docs, and llms.txt —
 * this is how 12 block manifests and FlowCanvas silently went missing.
 */

import assert from 'node:assert/strict'
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { basename, dirname, join, relative } from 'node:path'
import { describe, it } from 'node:test'

const REPO_ROOT = join(import.meta.dirname, '../..')

/** Metas intentionally NOT in the registry. Key: repo-relative meta path. */
const EXCLUDED: Record<string, string> = {
  // (none currently — add `path: reason` entries when a meta is internal-only)
}

function collectMetas(dir: string): string[] {
  const results: string[] = []
  try {
    for (const entry of readdirSync(dir)) {
      if (entry === 'node_modules' || entry === 'dist') continue
      const full = join(dir, entry)
      if (statSync(full).isDirectory()) results.push(...collectMetas(full))
      else if (entry.endsWith('.meta.ts')) results.push(full)
    }
  } catch {
    // unreadable dir
  }
  return results
}

describe('meta-coverage — every manifest on disk is registered', () => {
  it('each *.meta.ts maps to a registry entry or an explicit exclusion', () => {
    const registry = JSON.parse(readFileSync(join(REPO_ROOT, 'registry.json'), 'utf8')) as {
      components: { name: string }[]
      blocks?: { name: string }[]
    }
    const registered = new Set([
      ...registry.components.map((c) => c.name.toLowerCase()),
      ...(registry.blocks ?? []).map((b) => b.name.toLowerCase()),
    ])

    const sourcePackages = ['components', 'layouts', 'charts', 'editor', 'flow']
    const metas = sourcePackages.flatMap((pkg) =>
      collectMetas(join(REPO_ROOT, 'packages', pkg, 'src')),
    )
    assert.ok(metas.length > 150, `implausibly few metas found (${metas.length}) — scan broken?`)

    const prefixes = ['', 'layout/', 'block/', 'chart/', 'editor/', 'section/', 'flow/']
    const unregistered: string[] = []
    for (const metaPath of metas) {
      const rel = relative(REPO_ROOT, metaPath)
      if (EXCLUDED[rel] !== undefined) continue
      const dir = basename(dirname(metaPath)).toLowerCase()
      const hit = prefixes.some((p) => registered.has(`${p}${dir}`))
      if (!hit) unregistered.push(rel)
    }

    assert.deepEqual(
      unregistered,
      [],
      `Manifests on disk but not in registry.json (invisible to CLI/MCP/docs — register them or add an EXCLUDED entry with a reason):\n  ${unregistered.join('\n  ')}`,
    )
  })

  it('exclusion list has no stale entries', () => {
    const stale = Object.keys(EXCLUDED).filter((rel) => {
      try {
        return !statSync(join(REPO_ROOT, rel)).isFile()
      } catch {
        return true
      }
    })
    assert.deepEqual(stale, [], `Excluded metas that no longer exist: ${stale.join(', ')}`)
  })
})
