/**
 * Generates `packages/render/schema/view.v1.json` (JSON Schema draft-2020-12)
 * from the registry.json manifest.
 *
 * Run with: `pnpm schema:generate`
 */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { componentNames as renderableNames } from '../../packages/render/src/component-names.ts'
import {
  classifyProp,
  contextFor,
  pickCanonical,
  type JsonSchema,
  type ResolveContext,
  type TypeDefMeta,
} from './catalog-model.ts'

const HERE = dirname(fileURLToPath(import.meta.url))
const REPO_ROOT = join(HERE, '..', '..')
const REGISTRY_PATH = join(REPO_ROOT, 'registry.json')
const SCHEMA_OUT = join(REPO_ROOT, 'packages', 'render', 'schema', 'view.v1.json')
const PROP_SCHEMAS_OUT = join(REPO_ROOT, 'packages', 'render', 'src', 'prop-schemas.ts')
const SCHEMA_ID =
  'https://raw.githubusercontent.com/cascivo/cascivo/main/packages/render/schema/view.v1.json'

interface PropMeta {
  name: string
  type: string
  required?: boolean
  default?: string
  description?: string
}

interface RegistryEntry {
  meta: { name: string; props?: PropMeta[] }
  [k: string]: unknown
}

interface Registry {
  components: RegistryEntry[]
}

const TRANSLATION_REF = { $ref: '#/$defs/TranslationRef' }

/**
 * `validateView` accepts a `{ $t }` TranslationRef for any top-level prop, and strings nested in
 * data props are translatable too, so view.v1 widens both. Enums stay exact (a `$t` there is not
 * a literal). Specific to view.v1: catalog.v1 and the A2UI catalog keep the strict schema.
 */
function allowTranslationRefs(node: unknown): unknown {
  if (Array.isArray(node)) return node.map(allowTranslationRefs)
  if (typeof node !== 'object' || node === null) return node
  const o = node as Record<string, unknown>
  if (o['type'] === 'string' && !('enum' in o) && !('const' in o)) {
    return { anyOf: [o, TRANSLATION_REF] }
  }
  return Object.fromEntries(Object.entries(o).map(([k, v]) => [k, allowTranslationRefs(v)]))
}

/** A top-level prop schema: the nested widening, then the whole value may be a TranslationRef. */
function viewPropSchema(schema: JsonSchema): JsonSchema {
  const { description: _description, ...rest } = schema
  const inner = rest['type'] === 'string' && !('enum' in rest) ? rest : allowTranslationRefs(rest)
  return { anyOf: [inner as JsonSchema, TRANSLATION_REF] }
}

/**
 * Manifest type strings drift from source (an optional `id` the manifest omits, a status input
 * the source also accepts), and these two outputs gate rendering, so nested fields are checked
 * for presence and type only. catalog.v1 and the A2UI catalog keep the strict schema (R12).
 */
function lenientContext(typeDefs: readonly TypeDefMeta[] | undefined): ResolveContext {
  // A ReactNode in data renders numbers as well as strings.
  return {
    ...contextFor(typeDefs),
    nodeInData: { anyOf: [{ type: 'string' }, { type: 'number' }] },
  }
}

/** Drops `additionalProperties: false` everywhere and `enum` below the prop's own value. */
function lenient(node: JsonSchema, nested = false): JsonSchema {
  const out: JsonSchema = {}
  for (const [k, v] of Object.entries(node)) {
    if ((k === 'additionalProperties' && v === false) || (nested && k === 'enum')) continue
    if (k === 'properties' && typeof v === 'object' && v !== null) {
      out[k] = Object.fromEntries(
        Object.entries(v).map(([f, sub]) => [f, lenient(sub as JsonSchema, true)]),
      )
    } else if (k === 'items' && typeof v === 'object' && v !== null) {
      out[k] = lenient(v as JsonSchema, true)
    } else if (k === 'anyOf' && Array.isArray(v)) {
      // Branches of the prop's own value are still top level: a top-level enum stays exact.
      out[k] = v.map((b: JsonSchema) => lenient(b, nested))
    } else out[k] = v
  }
  return out
}

const registry: Registry = JSON.parse(readFileSync(REGISTRY_PATH, 'utf-8'))
// One entry per meta.name, node-usable `component` entry first (AppShell/Stack share names).
const canonical = pickCanonical(registry.components)

const componentNames = registry.components.map((c) => c.meta.name).sort()

// Shared defs
const translationRef = {
  type: 'object',
  properties: {
    $t: { type: 'string' },
    params: { type: 'object', additionalProperties: { type: ['string', 'number'] } },
  },
  required: ['$t'],
  additionalProperties: false,
}

// bind: "$data.<path>" (host data) or "$state.<key>" (view-local state).
const bindRefPattern = '^\\$(data|state)\\.'
// events: "$actions.<name>" (host action) or "$state.set|toggle.<key>" (state writer).
const eventRefPattern = '^\\$actions\\.|^\\$state\\.(set|toggle)\\.'

const propValue = {
  $anchor: 'PropValue',
  // anyOf, not oneOf: a { $t } TranslationRef is also a plain object, so exactly-one never held.
  anyOf: [
    { type: 'string' },
    { type: 'number' },
    { type: 'boolean' },
    { type: 'null' },
    { $ref: '#/$defs/TranslationRef' },
    { type: 'array', items: { $dynamicRef: '#PropValue' } },
    { type: 'object', additionalProperties: { $dynamicRef: '#PropValue' } },
  ],
}

// Per-component anyOf branches constraining props
const componentBranches = [...canonical.values()].map((entry) => {
  const name = entry.meta.name
  const ctx = lenientContext(entry.meta.typeDefs)
  const props: Record<string, unknown> = {}
  const required: string[] = []

  for (const prop of entry.meta.props) {
    // Slots, events and omitted props get no constraint: children is a node field, not a prop.
    const c = classifyProp(prop, ctx)
    if (c.kind !== 'data') continue
    props[prop.name] = viewPropSchema(lenient(c.schema))
    if (prop.required && prop.default === undefined) required.push(prop.name)
  }

  const branch: Record<string, unknown> = {
    if: {
      properties: { component: { const: name } },
      required: ['component'],
    },
  }
  // eslint-disable-next-line unicorn/no-thenable -- JSON Schema uses 'then' as a standard keyword
  branch['then'] = {
    properties: {
      props: { type: 'object', properties: props },
    },
    // A required data prop may arrive through `props` or `bind`; only data props can be required.
    ...(required.length > 0
      ? {
          allOf: required.map((n) => ({
            anyOf: [
              { properties: { props: { required: [n] } }, required: ['props'] },
              { properties: { bind: { required: [n] } }, required: ['bind'] },
            ],
          })),
        }
      : {}),
  }
  return branch
})

const schema = {
  $schema: 'https://json-schema.org/draft/2020-12/schema',
  $id: SCHEMA_ID,
  title: 'CascivoView v1 Config',
  description: 'JSON-configured UI layout for @cascivo/render <CascivoView />',
  type: 'object',
  properties: {
    $schema: { type: 'string' },
    version: { const: 1 },
    state: {
      type: 'object',
      description: 'View-local state: initial primitive values, read via bind "$state.<key>".',
      additionalProperties: { type: ['string', 'number', 'boolean', 'null'] },
    },
    view: {
      type: 'object',
      properties: {
        regions: {
          type: 'object',
          additionalProperties: {
            type: 'array',
            items: { $ref: '#/$defs/ComponentNode' },
          },
        },
      },
      required: ['regions'],
    },
  },
  required: ['view'],
  $defs: {
    TranslationRef: translationRef,
    PropValue: propValue,
    ComponentNode: {
      type: 'object',
      properties: {
        component: { type: 'string', enum: componentNames },
        props: { type: 'object', additionalProperties: { $ref: '#/$defs/PropValue' } },
        bind: {
          type: 'object',
          additionalProperties: { type: 'string', pattern: bindRefPattern },
        },
        events: {
          type: 'object',
          additionalProperties: { type: 'string', pattern: eventRefPattern },
        },
        children: {
          oneOf: [
            { type: 'array', items: { $ref: '#/$defs/ComponentNode' } },
            { type: 'string' },
            { $ref: '#/$defs/TranslationRef' },
          ],
        },
      },
      required: ['component'],
      allOf: componentBranches,
    },
  },
}

mkdirSync(dirname(SCHEMA_OUT), { recursive: true })
writeFileSync(SCHEMA_OUT, JSON.stringify(schema, null, 2) + '\n', 'utf-8')
console.log(`Generated ${SCHEMA_OUT}`)
console.log(`  Components: ${componentNames.length}`)

// ---------------------------------------------------------------------------
// Browser-safe per-component prop schemas for the render-time conformance
// validator (v40 T2). `validateView` runs in the browser via <CascivoView />,
// so it cannot read registry.json from disk — this emits a plain TS object.
// ---------------------------------------------------------------------------

type Primitive = 'string' | 'number' | 'boolean' | 'null'
const PRIMITIVE_KEYWORDS: Record<string, Primitive> = {
  string: 'string',
  number: 'number',
  boolean: 'boolean',
  null: 'null',
  true: 'boolean',
  false: 'boolean',
}

/** Classify a prop's TypeScript type into the constraints the validator checks. */
function classifyPropType(typeStr: string): { enum?: string[]; primitives?: Primitive[] } {
  const branches = typeStr
    .split('|')
    .map((s) => s.trim())
    .filter((s) => s.length > 0)
  if (branches.length === 0) return {}
  // Primitive union: every branch is a primitive keyword.
  if (branches.every((b) => b in PRIMITIVE_KEYWORDS)) {
    const set = new Set(branches.map((b) => PRIMITIVE_KEYWORDS[b]!))
    return { primitives: [...set] }
  }
  // Enum union: every branch is a quoted string literal.
  const values: string[] = []
  for (const b of branches) {
    const quoted = b.match(/^['"](.+)['"]$/)
    if (!quoted?.[1]) return {} // mixed / complex — unconstrained
    values.push(quoted[1])
  }
  return { enum: values }
}

/** Drops annotation keys, which the render-time checker never reads, to keep prop-schemas.ts small. */
function stripAnnotations(node: unknown): unknown {
  if (Array.isArray(node)) return node.map(stripAnnotations)
  if (typeof node !== 'object' || node === null) return node
  return Object.fromEntries(
    Object.entries(node)
      .filter(([k]) => k !== 'description' && k !== 'default')
      // `properties` maps field names to schemas, so a field named "default" must survive.
      .map(([k, v]) => [
        k,
        k === 'properties' && typeof v === 'object' && v !== null
          ? Object.fromEntries(Object.entries(v).map(([f, sub]) => [f, stripAnnotations(sub)]))
          : stripAnnotations(v),
      ]),
  )
}

/** The data schema for props whose structure `validateView` can check: objects, arrays and anyOf. */
function shapeOf(schema: JsonSchema): JsonSchema | undefined {
  const structured = schema['type'] === 'object' || schema['type'] === 'array' || 'anyOf' in schema
  return structured ? (stripAnnotations(schema) as JsonSchema) : undefined
}

const propSchemas: Record<string, unknown[]> = {}
for (const name of [...canonical.keys()].sort()) {
  const entry = canonical.get(name)!
  const ctx = lenientContext(entry.meta.typeDefs)
  propSchemas[name] = entry.meta.props.map((p) => {
    const { enum: enumValues, primitives } = classifyPropType(p.type)
    const c = classifyProp(p, ctx)
    // validateView only checks props of components the renderer can build; other shapes are dead bytes.
    const shape =
      c.kind === 'data' && renderableNames.has(name) ? shapeOf(lenient(c.schema)) : undefined
    return {
      name: p.name,
      required: p.required === true,
      ...(enumValues ? { enum: enumValues } : {}),
      ...(primitives ? { primitives } : {}),
      ...(shape ? { shape } : {}),
    }
  })
}

const propSchemasFile = `// generated — do not edit (scripts/schema/generate.ts)
// Per-component prop schemas for the render-time conformance validator (v40 T2).

export type PropPrimitive = 'string' | 'number' | 'boolean' | 'null'

/** A data-prop JSON Schema subset: type, enum, properties, required, additionalProperties, items, anyOf. */
export type ShapeSchema = Record<string, unknown>

export interface PropSchema {
  name: string
  required: boolean
  /** Allowed values when the prop is a string-literal union. */
  enum?: string[]
  /** Allowed primitive \`typeof\`s when the prop is a primitive (union). */
  primitives?: PropPrimitive[]
  /** Structure of an object, array or union prop, checked recursively by the validator. */
  shape?: ShapeSchema
}

export const propSchemas: Record<string, PropSchema[]> = ${JSON.stringify(propSchemas, null, 2)}
`
writeFileSync(PROP_SCHEMAS_OUT, propSchemasFile, 'utf-8')
console.log(`Generated ${PROP_SCHEMAS_OUT}`)
