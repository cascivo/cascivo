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
const SCHEMA_ID =
  'https://raw.githubusercontent.com/urbanisierung/cascade-ui/main/packages/render/schema/view.v1.json'

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

const dataRefPattern = '^\\$data\\.'
const actionRefPattern = '^\\$actions\\.'

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
    then: {
      properties: {
        props: {
          type: 'object',
          properties: props,
          ...(required.length > 0 ? { required } : {}),
        },
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
    view: {
      type: 'object',
      properties: {
        layout: { type: 'string' },
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
          additionalProperties: { type: 'string', pattern: dataRefPattern },
        },
        events: {
          type: 'object',
          additionalProperties: { type: 'string', pattern: actionRefPattern },
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
