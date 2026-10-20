import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { A2UI_CATALOG_ID, A2UI_RESERVED, toA2uiCatalog } from './a2ui.ts'
import type { Catalog, CatalogComponent } from './catalog-model.ts'

const C = 'https://a2ui.org/specification/v0_9/common_types.json#/$defs/'

const comp = (over: Partial<CatalogComponent>): CatalogComponent => ({
  description: 'd',
  category: 'x',
  props: { type: 'object', properties: {}, additionalProperties: false },
  slots: {},
  events: {},
  omitted: {},
  ...over,
})

const catalog: Catalog = {
  $id: 'x',
  version: 1,
  components: {
    Alpha: comp({
      description: 'Alpha thing',
      props: {
        type: 'object',
        required: ['label'],
        additionalProperties: false,
        properties: {
          label: { type: 'string', description: 'Label', default: 'hi' },
          count: { type: 'number' },
          on: { type: 'boolean' },
          variant: { type: 'string', enum: ['a', 'b'] },
          tags: { type: 'array', items: { type: 'string' } },
          rows: { type: 'array', items: { type: 'object' } },
          id: { type: 'string' },
        },
      },
      slots: {
        children: { arity: 'many', required: false },
        icon: { arity: 'one', required: true },
      },
      events: { onClick: { description: 'click' } },
    }),
    Beta: comp({}),
  },
}

type Obj = Record<string, any>
const out = toA2uiCatalog(catalog) as Obj
const alpha = out['components'].Alpha
const branch = alpha.allOf[1]
const p = branch.properties

describe('toA2uiCatalog', () => {
  it('maps data types', () => {
    assert.deepEqual(p.label, { $ref: C + 'DynamicString', description: 'Label', default: 'hi' })
    assert.deepEqual(p.count, { $ref: C + 'DynamicNumber' })
    assert.deepEqual(p.on, { $ref: C + 'DynamicBoolean' })
    assert.deepEqual(p.variant, { type: 'string', enum: ['a', 'b'] })
    assert.deepEqual(p.tags, { $ref: C + 'DynamicStringList' })
    assert.deepEqual(p.rows, {
      anyOf: [{ type: 'array', items: { type: 'object' } }, { $ref: C + 'DataBinding' }],
    })
  })
  it('maps slots and events', () => {
    assert.deepEqual(p.children, { $ref: C + 'ChildList' })
    assert.deepEqual(p.icon, { $ref: C + 'ComponentId' })
    assert.deepEqual(p.onClick, { $ref: C + 'Action', description: 'click' })
  })
  it('omits reserved names and records them', () => {
    assert.ok(A2UI_RESERVED.has('id'))
    assert.equal(p.id, undefined)
    assert.deepEqual(alpha['x-cascivo-omitted'], { id: { reason: 'reserved-name' } })
    assert.equal(out['components'].Beta['x-cascivo-omitted'], undefined)
  })
  it('shapes component and required', () => {
    assert.deepEqual(alpha.allOf[0], { $ref: C + 'ComponentCommon' })
    assert.equal(alpha.unevaluatedProperties, false)
    assert.deepEqual(p.component, { const: 'Alpha' })
    assert.deepEqual(branch.required, ['component', 'icon', 'label'])
    assert.equal(branch.required[0], 'component')
  })
  it('has top-level fields', () => {
    assert.equal(out['catalogId'], A2UI_CATALOG_ID)
    assert.equal(out['$id'], A2UI_CATALOG_ID)
    assert.equal(Object.keys(out['functions']).length, 14)
    assert.deepEqual(
      out['$defs'].anyFunction.oneOf.map((r: Obj) => r['$ref']),
      Object.keys(out['functions']).map((f) => `#/functions/${f}`),
    )
    assert.deepEqual(out['$defs'].anyComponent.oneOf[0], { $ref: '#/components/Alpha' })
  })
})
