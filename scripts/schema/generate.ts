/**
 * Generates `packages/render/schema/view.v1.json` (JSON Schema draft-2020-12)
 * from the registry.json manifest.
 *
 * Run with: `pnpm schema:generate`
 */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

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

function parseUnionLiterals(typeStr: string): string[] | null {
  const branches = typeStr.split('|').map((s) => s.trim())
  const literals: string[] = []
  for (const branch of branches) {
    const quoted = branch.match(/^['"](.+)['"]$/)
    if (quoted?.[1] !== undefined) {
      literals.push(quoted[1])
      continue
    }
    if (/^[a-zA-Z_$][\w$-]*$/.test(branch)) {
      literals.push(branch)
      continue
    }
    return null
  }
  return literals
}

function propTypeToSchema(typeStr: string): Record<string, unknown> | null {
  const t = typeStr.trim()
  if (t === 'string') return { type: 'string' }
  if (t === 'number') return { type: 'number' }
  if (t === 'boolean') return { type: 'boolean' }
  const literals = parseUnionLiterals(t)
  if (literals) return { type: 'string', enum: literals }
  return null // complex type — no constraint
}

const registry: Registry = JSON.parse(readFileSync(REGISTRY_PATH, 'utf-8'))

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
  oneOf: [
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
const componentBranches = registry.components.map((entry) => {
  const name = entry.meta.name
  const props: Record<string, unknown> = {}
  const required: string[] = []

  for (const prop of entry.meta.props ?? []) {
    const schema = propTypeToSchema(prop.type)
    if (schema) props[prop.name] = schema
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
      props: {
        type: 'object',
        properties: props,
        ...(required.length > 0 ? { required } : {}),
      },
    },
  }
  return branch
})

const schema = {
  $schema: 'https://json-schema.org/draft/2020-12/schema',
  $id: SCHEMA_ID,
  title: 'CascadeView v1 Config',
  description: 'JSON-configured UI layout for @cascivo/render <CascadeView />',
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
// validator (v40 T2). `validateView` runs in the browser via <CascadeView />,
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

// Prefer the node-usable `component` entry when a meta.name is shared (AppShell/Stack).
const TYPE_RANK: Record<string, number> = {
  component: 0,
  block: 1,
  chart: 2,
  section: 3,
  layout: 4,
}
const canonical = new Map<string, RegistryEntry>()
for (const entry of registry.components) {
  const e = entry as RegistryEntry & { name?: string; type?: string }
  const key = e.meta.name
  const current = canonical.get(key) as (RegistryEntry & { type?: string }) | undefined
  if (!current || (TYPE_RANK[e.type ?? ''] ?? 9) < (TYPE_RANK[current.type ?? ''] ?? 9)) {
    canonical.set(key, entry)
  }
}

const propSchemas: Record<string, unknown[]> = {}
for (const name of [...canonical.keys()].sort()) {
  const entry = canonical.get(name)!
  propSchemas[name] = (entry.meta.props ?? []).map((p) => {
    const { enum: enumValues, primitives } = classifyPropType(p.type)
    return {
      name: p.name,
      required: p.required === true,
      ...(enumValues ? { enum: enumValues } : {}),
      ...(primitives ? { primitives } : {}),
    }
  })
}

const propSchemasFile = `// generated — do not edit (scripts/schema/generate.ts)
// Per-component prop schemas for the render-time conformance validator (v40 T2).

export type PropPrimitive = 'string' | 'number' | 'boolean' | 'null'

export interface PropSchema {
  name: string
  required: boolean
  /** Allowed values when the prop is a string-literal union. */
  enum?: string[]
  /** Allowed primitive \`typeof\`s when the prop is a primitive (union). */
  primitives?: PropPrimitive[]
}

export const propSchemas: Record<string, PropSchema[]> = ${JSON.stringify(propSchemas, null, 2)}
`
writeFileSync(PROP_SCHEMAS_OUT, propSchemasFile, 'utf-8')
console.log(`Generated ${PROP_SCHEMAS_OUT}`)
