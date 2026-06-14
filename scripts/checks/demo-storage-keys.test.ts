/**
 * Demo storage-key collision check — v22 enforcement.
 *
 * The five example demos (deploy/pay/flow/track/pulse) used to deploy to
 * separate Cloudflare Pages projects (separate origins → isolated storage).
 * v22 assembles them into the landing under one origin (cascivo.com), so they
 * now SHARE localStorage/IndexedDB. Each `persistedSignal` key must therefore be
 * uniquely prefixed by its demo, or two demos would clobber each other's state.
 *
 * This test scans every demo's source for `persistedSignal(<key>)` literals and
 * asserts (a) every key is prefixed with its own demo slug, and (b) no key is
 * declared by more than one demo.
 */

import assert from 'node:assert/strict'
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { extname, join } from 'node:path'
import { describe, it } from 'node:test'

const REPO_ROOT = join(import.meta.dirname, '../..')
const EXAMPLES_DIR = join(REPO_ROOT, 'apps/examples')

// slug → accepted key prefixes. Keys may use either `<slug>.` or `<slug>-`.
const DEMOS = ['deploy', 'pay', 'flow', 'track', 'pulse'] as const

function collectSourceFiles(dir: string): string[] {
  const results: string[] = []
  for (const entry of readdirSync(dir)) {
    if (entry === 'node_modules' || entry === 'dist') continue
    const full = join(dir, entry)
    if (statSync(full).isDirectory()) results.push(...collectSourceFiles(full))
    else if (['.ts', '.tsx'].includes(extname(entry))) results.push(full)
  }
  return results
}

/** Extract the string-literal key from every `persistedSignal('key', …)` call. */
function keysIn(dir: string): string[] {
  const re = /persistedSignal\s*(?:<[^>]*>)?\s*\(\s*['"]([^'"]+)['"]/g
  const keys: string[] = []
  for (const file of collectSourceFiles(dir)) {
    const src = readFileSync(file, 'utf8')
    for (const m of src.matchAll(re)) {
      if (m[1]) keys.push(m[1])
    }
  }
  return keys
}

describe('demo storage keys (shared origin under v22)', () => {
  const owner = new Map<string, string>() // key → demo slug

  for (const slug of DEMOS) {
    it(`${slug}: every persisted key is prefixed with "${slug}"`, () => {
      const keys = keysIn(join(EXAMPLES_DIR, slug, 'src'))
      assert.ok(keys.length > 0, `expected at least one persistedSignal key in ${slug}`)
      for (const key of keys) {
        assert.ok(
          key === slug || key.startsWith(`${slug}.`) || key.startsWith(`${slug}-`),
          `${slug} uses storage key "${key}" not prefixed by its slug — would collide on the shared origin`,
        )
        const prev = owner.get(key)
        assert.ok(
          prev === undefined,
          `storage key "${key}" declared by both "${prev}" and "${slug}"`,
        )
        owner.set(key, slug)
      }
    })
  }
})
