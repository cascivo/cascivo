/**
 * `cascivo add` copies each component's manifest (`<name>.meta.ts`) with its source.
 *
 * The manifest is what an adopter's own tooling reads (the workbench, agents, `cascivo
 * audit`): props, examples, tokens, accessibility. Without it a copied component loses the
 * data that makes cascivo AI-first the moment it leaves the registry (2026-10-07 research,
 * §1.4 defect 7). The registry's `files` list is what `add` copies and `update` merges, so the
 * guarantee is that every copied entry lists its manifest and hashes it.
 *
 * Run: `pnpm meta:check`.
 */
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { test } from 'node:test'
import { fileURLToPath } from 'node:url'

const ROOT = join(fileURLToPath(new URL('.', import.meta.url)), '..', '..')

interface Entry {
  name: string
  files: string[]
  fileHashes?: Record<string, string>
}

function components(): Entry[] {
  const raw: unknown = JSON.parse(readFileSync(join(ROOT, 'registry.json'), 'utf8'))
  if (typeof raw !== 'object' || raw === null || !('components' in raw)) {
    throw new Error('registry.json has no "components"')
  }
  const list = raw.components
  if (!Array.isArray(list)) throw new Error('registry.json "components" is not an array')
  return list.filter(
    (e): e is Entry =>
      typeof e === 'object' && e !== null && typeof e.name === 'string' && Array.isArray(e.files),
  )
}

test('every copied component ships its manifest, hashed', () => {
  const copied = components().filter((e) => e.files.length > 0)
  assert.ok(copied.length > 100, `only ${copied.length} copied components; the registry moved`)
  const missing: string[] = []
  for (const entry of copied) {
    const local = entry.name.split('/').pop()!
    const manifest = `${local}.meta.ts`
    if (!entry.files.some((url) => url.endsWith(`/${manifest}`)) || !entry.fileHashes?.[manifest]) {
      missing.push(entry.name)
    }
  }
  assert.deepEqual(missing, [], `copied without their manifest: ${missing.join(', ')}`)
})
