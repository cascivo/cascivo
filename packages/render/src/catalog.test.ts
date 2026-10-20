import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import Ajv2020 from 'ajv/dist/2020'
import { describe, expect, it } from 'vitest'
import { componentNames } from './component-names.ts'
import { TS_TYPE_NAME, enums } from './test-utils/enum-walk.ts'

const HERE = dirname(fileURLToPath(import.meta.url))
const CATALOG_PATH = join(HERE, '..', 'schema', 'catalog.v1.json')
const REGISTRY_PATH = join(HERE, '..', '..', '..', 'registry.json')

interface Comp {
  parent?: string
  props: {
    properties: Record<string, { enum?: unknown[]; items?: { required?: string[] } }>
  }
  slots: Record<string, { arity: string; implicit?: boolean }>
  events: Record<string, unknown>
  omitted: Record<string, unknown>
}
const catalog = JSON.parse(readFileSync(CATALOG_PATH, 'utf-8')) as {
  $id: string
  version: number
  components: Record<string, Comp>
}
const registry = JSON.parse(readFileSync(REGISTRY_PATH, 'utf-8')) as {
  components: { type?: string; meta: { name: string; props?: { name: string }[] } }[]
}

describe('catalog.v1.json', () => {
  it('has the neutral $id and version 1', () => {
    expect(catalog.$id).toBe(
      'https://raw.githubusercontent.com/cascivo/cascivo/main/packages/render/schema/catalog.v1.json',
    )
    expect(catalog.version).toBe(1)
  })

  it('covers exactly the renderable names', () => {
    expect(Object.keys(catalog.components).sort()).toEqual([...componentNames].sort())
  })

  it('classifies Button and DataTable props', () => {
    const button = catalog.components['Button']!
    expect(button.slots['children']?.arity).toBe('many')
    expect(button.slots['children']?.implicit).toBe(true)
    expect(catalog.components['Input']!.slots['children']).toBeUndefined()
    expect('onClick' in button.events).toBe(true)
    expect(button.props.properties['variant']?.enum).toContain('primary')
    expect(catalog.components['DataTable']!.props.properties['columns']?.items?.required).toEqual([
      'key',
      'header',
    ])
  })

  it('does not infer children from sibling components in the same file', () => {
    expect(catalog.components['Toast']!.slots['children']).toBeUndefined()
    expect(catalog.components['Radio']!.slots['children']).toBeUndefined()
    expect(catalog.components['Button']!.slots['children']?.arity).toBe('many')
  })

  it('never emits the string "undefined" as a default', () => {
    const defaults = (n: unknown, out: unknown[] = []): unknown[] => {
      if (Array.isArray(n)) n.forEach((x) => defaults(x, out))
      else if (typeof n === 'object' && n !== null) {
        for (const [k, v] of Object.entries(n)) {
          if (k === 'default') out.push(v)
          defaults(v, out)
        }
      }
      return out
    }
    expect(defaults(catalog)).not.toContain('undefined')
  })

  it('records sub-component parents', () => {
    expect(catalog.components['CardHeader']?.parent).toBe('Card')
  })

  it('never leaks TS type names into an enum', () => {
    for (const e of enums(catalog)) {
      for (const m of e) expect(typeof m === 'string' && TS_TYPE_NAME.test(m)).toBe(false)
    }
  })

  it('places every manifest prop in exactly one bucket', () => {
    const rank: Record<string, number> = { component: 0, block: 1, chart: 2, section: 3, layout: 4 }
    const canon = new Map<string, (typeof registry.components)[number]>()
    for (const e of registry.components) {
      const cur = canon.get(e.meta.name)
      if (!cur || (rank[e.type ?? ''] ?? 9) < (rank[cur.type ?? ''] ?? 9)) canon.set(e.meta.name, e)
    }
    for (const name of componentNames) {
      const entry = canon.get(name)
      if (!entry) continue
      const c = catalog.components[name]!
      for (const p of entry.meta.props ?? []) {
        const hits = [c.props.properties, c.slots, c.events, c.omitted].filter((b) => p.name in b)
        expect(hits.length, `${name}.${p.name}`).toBe(1)
      }
    }
  })
})

describe('A2UI v0.9 catalog', () => {
  const A2UI_PATH = join(HERE, '..', 'schema', 'a2ui', 'v0_9', 'catalog.json')
  const SITE_PATH = join(
    HERE,
    '..',
    '..',
    '..',
    'apps',
    'site',
    'public',
    'a2ui',
    'v0_9',
    'catalog.json',
  )
  const ID = 'https://cascivo.com/a2ui/v0_9/catalog.json'
  const a2ui = JSON.parse(readFileSync(A2UI_PATH, 'utf-8')) as Record<string, unknown> & {
    components: Record<string, { allOf: { properties?: Record<string, unknown> }[] }>
  }
  const common: unknown = JSON.parse(
    readFileSync(join(HERE, '__fixtures__', 'a2ui', 'v0_9', 'common_types.json'), 'utf-8'),
  )
  const ajv = new Ajv2020({ strict: false })
  ajv.addSchema(common as object)
  // Kept even though our catalog now defines $defs.anyFunction: common_types' relative ref resolves
  // against https://a2ui.org/.../catalog.json, not our $id. common_types resolves `catalog.json#/$defs/anyFunction` against whichever catalog is in use; stub it.
  ajv.addSchema({
    $id: 'https://a2ui.org/specification/v0_9/catalog.json',
    $defs: { anyFunction: { type: 'object' } },
  })
  const validator = (name: string) => ajv.compile({ $ref: `${ID}#/components/${name}` })
  ajv.addSchema(a2ui as object)

  it('packaged and site copies are byte-identical with the expected ids', () => {
    expect(readFileSync(SITE_PATH, 'utf-8')).toBe(readFileSync(A2UI_PATH, 'utf-8'))
    expect(a2ui['catalogId']).toBe(ID)
    expect(a2ui['$id']).toBe(ID)
  })

  it('defines anyFunction over exactly the functions keys', () => {
    const fns = Object.keys(a2ui['functions'] as object)
    const defs = a2ui['$defs'] as { anyFunction: { oneOf: { $ref: string }[] } }
    expect(fns).toHaveLength(14)
    expect(defs.anyFunction.oneOf.map((r) => r.$ref)).toEqual(fns.map((f) => `#/functions/${f}`))
  })

  it('omits reserved-name props, recording them', () => {
    const search = a2ui.components['Search'] as unknown as {
      allOf: { properties?: Record<string, unknown> }[]
      'x-cascivo-omitted': Record<string, { reason: string }>
    }
    expect(search.allOf[1]?.properties?.['id']).toBeUndefined()
    expect(search['x-cascivo-omitted']['id']?.reason).toBe('reserved-name')
  })

  it('validates Button', () => {
    const v = validator('Button')
    const ok = { id: 'b', component: 'Button', children: ['t'], onClick: { event: { name: 'go' } } }
    expect(v(ok)).toBe(true)
    expect(v({ ...ok, foo: 1 })).toBe(false)
  })

  it('validates Input data bindings', () => {
    const v = validator('Input')
    expect(v({ id: 'i', component: 'Input', label: { path: '/form/label' } })).toBe(true)
  })

  it('validates DataTable columns', () => {
    const v = validator('DataTable')
    const base = { id: 'd', component: 'DataTable', rows: { path: '/rows' } }
    expect(v({ ...base, columns: [{ key: 'a', header: 'A' }] })).toBe(true)
    expect(v({ ...base, columns: { path: '/cols' } })).toBe(true)
    expect(v({ ...base, columns: [{ header: 'A' }] })).toBe(false)
  })
})
