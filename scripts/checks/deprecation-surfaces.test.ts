/**
 * A deprecation must be visible at DISCOVERY time, on every surface.
 *
 * `overflow-menu` carried a `@deprecated` JSDoc in its source for months. An adopter only
 * meets that after `cascivo add` has already written the file into their project — and it
 * named `@cascivo/components/menu`, an import path that resolves on neither install path.
 * `cascivo list` showed nothing. Neither did the MCP tools, the docs site, or `llms.txt`,
 * because `ComponentMeta` had no field for it to render.
 *
 * The fix is the manifest field; this is what keeps every surface reading it.
 */
import { readFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import test from 'node:test'
import assert from 'node:assert/strict'

const HERE = dirname(fileURLToPath(import.meta.url))
const ROOT = join(HERE, '..', '..')

interface Deprecation {
  since: string
  replacement: string
  note?: string
}
interface Entry {
  name: string
  deprecated?: Deprecation
  meta: { deprecated?: Deprecation }
}

const registry = JSON.parse(await readFile(join(ROOT, 'registry.json'), 'utf8')) as {
  components: Entry[]
}
const deprecated = registry.components.filter((c) => c.deprecated)
const names = new Set(registry.components.map((c) => c.name.toLowerCase()))

test('the registry has at least one deprecated entry to check', () => {
  assert.ok(
    deprecated.length > 0,
    'no deprecated entries — if the last one was removed, delete this guard rather than ' +
      'leaving it passing vacuously',
  )
})

test('every deprecation names a replacement that exists in the registry', () => {
  const dangling = deprecated
    .filter((c) => !names.has(c.deprecated!.replacement.toLowerCase()))
    .map((c) => `${c.name} → ${c.deprecated!.replacement}`)
  assert.deepEqual(
    dangling,
    [],
    `a deprecation must point at something installable: ${dangling.join(', ')}`,
  )
})

test('the deprecation is hoisted to the entry AND kept in the manifest', () => {
  // Surfaces read one or the other; both must agree, or a surface renders nothing.
  const mismatched = registry.components
    .filter((c) => Boolean(c.deprecated) !== Boolean(c.meta.deprecated))
    .map((c) => c.name)
  assert.deepEqual(mismatched, [], `deprecated present on only one of entry/meta: ${mismatched}`)
})

test('a deprecated component does not point at itself', () => {
  const selfish = deprecated
    .filter((c) => c.deprecated!.replacement.toLowerCase() === c.name.toLowerCase())
    .map((c) => c.name)
  assert.deepEqual(selfish, [], `self-referential deprecation: ${selfish.join(', ')}`)
})

test('every consuming surface reads the deprecation field', async () => {
  // Assert on the code that renders it, not on the field's presence: a type that carries
  // `deprecated` while no surface prints it is exactly the state this replaced.
  const surfaces: [string, RegExp][] = [
    ['packages/cli/src/commands/list.ts', /deprecated/],
    ['packages/cli/src/commands/add.ts', /entry\.deprecated/],
    ['packages/cli/src/utils/registry.ts', /deprecated\?:/],
    ['packages/mcp/src/registry.ts', /deprecated\?:/],
  ]
  for (const [rel, re] of surfaces) {
    const src = await readFile(join(ROOT, rel), 'utf8')
    assert.match(src, re, `${rel} must read the deprecation field`)
  }
})

test('no deprecated component names an unpublishable package in its source doc', async () => {
  for (const c of deprecated) {
    const dir = c.name.includes('/') ? c.name.split('/').pop()! : c.name
    const path = join(ROOT, 'packages', 'components', 'src', dir, `${dir}.tsx`)
    let src: string
    try {
      src = await readFile(path, 'utf8')
    } catch {
      continue
    }
    assert.ok(
      !/@cascivo\/components/.test(src),
      `${c.name}: its @deprecated notice names @cascivo/components, which is private and ` +
        'cannot be installed. Point at `cascivo add <name>` or `@cascivo/react`.',
    )
  }
})
