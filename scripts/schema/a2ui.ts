/**
 * Projects the protocol-neutral component catalog onto an A2UI v0.9 custom catalog
 * (https://a2ui.org/specification/v0_9). Mirrors the shape of the A2UI basic catalog.
 */
import type { Catalog, CatalogComponent, JsonSchema } from './catalog-model.ts'

const COMMON = 'https://a2ui.org/specification/v0_9/common_types.json#/$defs/'
const BASIC = 'https://a2ui.org/specification/v0_9/catalogs/basic/catalog.json'

export const A2UI_CATALOG_ID = 'https://cascivo.com/a2ui/v0_9/catalog.json'

/** Names ComponentCommon already owns; a component prop with one of these cannot be expressed. */
export const A2UI_RESERVED = new Set(['id', 'component', 'accessibility'])

const BASIC_FUNCTIONS = [
  'required',
  'regex',
  'length',
  'numeric',
  'email',
  'formatString',
  'formatNumber',
  'formatCurrency',
  'formatDate',
  'pluralize',
  'openUrl',
  'and',
  'or',
  'not',
]

const ref = (name: string): JsonSchema => ({ $ref: COMMON + name })

function withMeta(base: JsonSchema, source: JsonSchema): JsonSchema {
  const out = { ...base }
  if (typeof source['description'] === 'string') out['description'] = source['description']
  if ('default' in source) out['default'] = source['default']
  return out
}

function dataSchema(schema: JsonSchema): JsonSchema {
  if (Array.isArray(schema['enum'])) return schema
  const items = schema['items']
  const itemType =
    typeof items === 'object' && items !== null && 'type' in items ? items['type'] : undefined
  switch (schema['type']) {
    case 'string':
      return withMeta(ref('DynamicString'), schema)
    case 'number':
      return withMeta(ref('DynamicNumber'), schema)
    case 'boolean':
      return withMeta(ref('DynamicBoolean'), schema)
    case 'array':
      if (
        itemType === 'string' &&
        Object.keys(schema).every((k) => ['type', 'items', 'description', 'default'].includes(k))
      )
        return withMeta(ref('DynamicStringList'), schema)
      break
  }
  return { anyOf: [schema, ref('DataBinding')] }
}

function toComponent(name: string, c: CatalogComponent): JsonSchema {
  const props: Record<string, JsonSchema> = { component: { const: name } }
  const omitted: Record<string, { reason: string }> = {}
  const required = new Set<string>()
  const put = (key: string, schema: JsonSchema, isRequired: boolean): void => {
    if (A2UI_RESERVED.has(key)) {
      omitted[key] = { reason: 'reserved-name' }
      return
    }
    props[key] = schema
    if (isRequired) required.add(key)
  }
  for (const [k, s] of Object.entries(c.props.properties)) {
    put(k, dataSchema(s), c.props.required?.includes(k) ?? false)
  }
  for (const [k, s] of Object.entries(c.slots)) {
    const base = ref(s.arity === 'many' ? 'ChildList' : 'ComponentId')
    put(k, s.description ? { ...base, description: s.description } : base, s.required)
  }
  for (const [k, e] of Object.entries(c.events)) {
    const base = ref('Action')
    put(k, e.description ? { ...base, description: e.description } : base, false)
  }
  const out: JsonSchema = {
    type: 'object',
    allOf: [
      ref('ComponentCommon'),
      {
        type: 'object',
        description: c.description,
        properties: props,
        required: ['component', ...[...required].sort()],
      },
    ],
    unevaluatedProperties: false,
  }
  if (Object.keys(omitted).length > 0) out['x-cascivo-omitted'] = omitted
  return out
}

export function toA2uiCatalog(catalog: Catalog): JsonSchema {
  const names = Object.keys(catalog.components).sort()
  const components: Record<string, JsonSchema> = {}
  for (const n of names) {
    const c = catalog.components[n]
    if (c) components[n] = toComponent(n, c)
  }
  const functions: Record<string, JsonSchema> = {}
  for (const f of BASIC_FUNCTIONS) functions[f] = { $ref: `${BASIC}#/functions/${f}` }
  return {
    $schema: 'https://json-schema.org/draft/2020-12/schema',
    $id: A2UI_CATALOG_ID,
    catalogId: A2UI_CATALOG_ID,
    title: 'cascivo A2UI catalog',
    description:
      'cascivo components as an A2UI v0.9 custom catalog, derived from the protocol-neutral component catalog.',
    components,
    functions,
    $defs: { anyComponent: { oneOf: names.map((n) => ({ $ref: `#/components/${n}` })) } },
  }
}
