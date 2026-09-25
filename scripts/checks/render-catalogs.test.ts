/**
 * The A2UI and json-render catalogs are generated (scripts/render/generate-catalogs.ts), so
 * `pnpm regen`'s drift check keeps them current. This guards what drift cannot see: that the
 * A2UI catalog only references definitions A2UI v0.9 actually has, only offers components
 * `<CascivoView>` renders, and carries the catalog id `fromA2UI` documents.
 *
 * Run: node --experimental-strip-types --test scripts/checks/render-catalogs.test.ts
 */
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, it } from 'node:test'
import { A2UI_CATALOG_ID, renderableNames } from '../render/catalogs.ts'

const ROOT = join(import.meta.dirname, '..', '..')
const catalog = JSON.parse(
  readFileSync(join(ROOT, 'apps/site/public/a2ui/v0_9/catalog.json'), 'utf8'),
) as { catalogId: string; $id: string; components: Record<string, unknown> }

// `$defs` of https://a2ui.org/specification/v0_9/common_types.json.
const COMMON_DEFS = new Set([
  'ComponentId',
  'AccessibilityAttributes',
  'ComponentCommon',
  'ChildList',
  'DataBinding',
  'DynamicValue',
  'DynamicString',
  'DynamicNumber',
  'DynamicBoolean',
  'DynamicStringList',
  'FunctionCall',
  'CheckRule',
  'Checkable',
  'Action',
])

function refs(value: unknown, out: string[] = []): string[] {
  if (Array.isArray(value)) for (const v of value) refs(v, out)
  else if (typeof value === 'object' && value !== null) {
    for (const [k, v] of Object.entries(value)) {
      if (k === '$ref' && typeof v === 'string') out.push(v)
      else refs(v, out)
    }
  }
  return out
}

describe('A2UI catalog', () => {
  it('carries the id fromA2UI documents, as both $id and catalogId', () => {
    const src = readFileSync(join(ROOT, 'packages/render/src/a2ui.ts'), 'utf8')
    assert.ok(src.includes(`'${A2UI_CATALOG_ID}'`), 'a2ui.ts and catalogs.ts disagree on the id')
    assert.equal(catalog.catalogId, A2UI_CATALOG_ID)
    assert.equal(catalog.$id, A2UI_CATALOG_ID)
  })

  it('references only A2UI v0.9 common types and its own components', () => {
    const bad = refs(catalog).filter((ref) => {
      const common =
        /^https:\/\/a2ui\.org\/specification\/v0_9\/common_types\.json#\/\$defs\/(\w+)$/
      const m = common.exec(ref)
      if (m) return !COMMON_DEFS.has(m[1]!)
      const local = /^#\/components\/(\w+)$/.exec(ref)
      return !local || !(local[1]! in catalog.components)
    })
    assert.deepEqual(bad, [])
  })

  it('offers exactly the components <CascivoView> renders', () => {
    assert.deepEqual(Object.keys(catalog.components).sort(), renderableNames(ROOT))
  })
})
