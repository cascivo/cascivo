/**
 * Turns manifest prop types into JSON Schema and sorts props into data / slot / event.
 * Pure on purpose (no I/O): `buildCatalog` and the generators feed it manifest data.
 */
import { parseTsType, type TsType } from './ts-type.ts'

// Re-declared (not imported from @cascivo/core): scripts don't depend on workspace packages.
export interface PropMeta {
  name: string
  type: string
  required?: boolean
  default?: string
  description?: string
}

export interface TypeFieldMeta {
  name: string
  type: string
  required?: boolean
  description?: string
}

export interface TypeDefMeta {
  name: string
  description?: string
  fields: readonly TypeFieldMeta[]
}

export type JsonSchema = Record<string, unknown>

export interface ResolveContext {
  /** Keyed by exact name and by name without generics ('Column<Row>' and 'Column'). */
  typeDefs: ReadonlyMap<string, TypeDefMeta>
  /** Generic params declared by typedef names, e.g. 'Row' from 'Column<Row>'. */
  typeParams: ReadonlySet<string>
}

export type PropClass =
  | { kind: 'data'; schema: JsonSchema; description?: string; default?: unknown }
  | { kind: 'slot'; arity: 'one' | 'many' }
  | { kind: 'event' }
  | { kind: 'omitted'; reason: 'function' | 'unresolved-type' | 'unparseable' }

const NODE_REFS = new Set(['ReactNode', 'React.ReactNode', 'ReactElement', 'React.ReactElement'])
/** The parser keeps these as refs; none has a useful JSON Schema except `object`. */
const NO_SCHEMA_REFS = new Set(['void', 'any', 'unknown', 'never'])

export function contextFor(typeDefs: readonly TypeDefMeta[] | undefined): ResolveContext {
  const defs = new Map<string, TypeDefMeta>()
  const params = new Set<string>()
  for (const def of typeDefs ?? []) {
    defs.set(def.name, def)
    const m = /^([^<]+)<(.+)>$/.exec(def.name)
    if (!m?.[1] || !m[2]) continue
    defs.set(m[1], def)
    for (const p of m[2].split(',')) {
      const id = /^\s*([A-Za-z_$][\w$]*)/.exec(p)?.[1]
      if (id) params.add(id)
    }
  }
  return { typeDefs: defs, typeParams: params }
}

const isNodeRef = (t: TsType): boolean => t.kind === 'ref' && NODE_REFS.has(t.name)

function literalSchema(type: 'string' | 'number', values: (string | number)[]): JsonSchema {
  return { type, enum: values }
}

function unionSchema(
  members: TsType[],
  ctx: ResolveContext,
  inData: boolean,
  seen: ReadonlySet<string>,
): JsonSchema | null {
  const strings: string[] = []
  const numbers: number[] = []
  const bools = new Set<boolean>()
  const others: JsonSchema[] = []
  for (const m of members) {
    if (m.kind === 'primitive' && m.name === 'undefined') continue
    if (m.kind === 'literal') {
      if (typeof m.value === 'string') strings.push(m.value)
      else if (typeof m.value === 'number') numbers.push(m.value)
      else bools.add(m.value)
      continue
    }
    const s = convert(m, ctx, inData, seen)
    if (!s) return null
    others.push(s)
  }
  const parts: JsonSchema[] = []
  if (strings.length > 0) parts.push(literalSchema('string', strings))
  if (numbers.length > 0) parts.push(literalSchema('number', numbers))
  if (bools.size === 2) parts.push({ type: 'boolean' })
  else for (const b of bools) parts.push({ type: 'boolean', enum: [b] })
  parts.push(...others)
  const [only] = parts
  if (parts.length === 1 && only) return only
  return parts.length === 0 ? null : { anyOf: parts }
}

function objectSchema(
  fields: readonly { name: string; required: boolean; type: TsType | null; description?: string }[],
  ctx: ResolveContext,
  inData: boolean,
  seen: ReadonlySet<string>,
): JsonSchema | null {
  const properties: Record<string, JsonSchema> = {}
  const required: string[] = []
  for (const f of fields) {
    const s = f.type ? convert(f.type, ctx, inData, seen) : null
    if (!s) {
      // An unrepresentable required field would make every instance invalid, so the whole object goes.
      if (f.required) return null
      continue
    }
    properties[f.name] = f.description ? { ...s, description: f.description } : s
    if (f.required) required.push(f.name)
  }
  return {
    type: 'object',
    properties,
    ...(required.length > 0 ? { required } : {}),
    additionalProperties: false,
  }
}

function refSchema(
  t: Extract<TsType, { kind: 'ref' }>,
  ctx: ResolveContext,
  inData: boolean,
  seen: ReadonlySet<string>,
): JsonSchema | null {
  if (NODE_REFS.has(t.name)) return inData ? { type: 'string' } : null
  if (NO_SCHEMA_REFS.has(t.name)) return null
  if (t.name === 'object' || ctx.typeParams.has(t.name)) return { type: 'object' }
  const def = ctx.typeDefs.get(t.name)
  // `seen` stops a self-referencing typedef from recursing forever.
  if (!def || seen.has(def.name)) return null
  const s = objectSchema(
    def.fields.map((f) => ({
      name: f.name,
      required: f.required === true,
      type: parseTsType(f.type),
      ...(f.description ? { description: f.description } : {}),
    })),
    ctx,
    inData,
    new Set([...seen, def.name]),
  )
  if (!s) return null
  return def.description ? { ...s, description: def.description } : s
}

function convert(
  t: TsType,
  ctx: ResolveContext,
  inData: boolean,
  seen: ReadonlySet<string>,
): JsonSchema | null {
  switch (t.kind) {
    case 'primitive':
      return t.name === 'undefined' ? null : { type: t.name }
    case 'literal':
      return unionSchema([t], ctx, inData, seen)
    case 'union':
      return unionSchema(t.members, ctx, inData, seen)
    case 'array': {
      const items = convert(t.element, ctx, inData, seen)
      return items ? { type: 'array', items } : null
    }
    case 'object':
      return objectSchema(
        t.fields.map((f) => ({ name: f.name, required: !f.optional, type: f.type })),
        ctx,
        inData,
        seen,
      )
    case 'function':
      return null
    case 'ref':
      return refSchema(t, ctx, inData, seen)
  }
}

/** null when the type has no JSON representation (functions, unknown refs, slots outside data). */
export function toJsonSchema(t: TsType, ctx: ResolveContext, inData: boolean): JsonSchema | null {
  return convert(t, ctx, inData, new Set())
}

export function classifyProp(prop: PropMeta, ctx: ResolveContext): PropClass {
  const t = parseTsType(prop.type)
  if (!t) return { kind: 'omitted', reason: 'unparseable' }
  if (t.kind === 'function' || (t.kind === 'ref' && t.name.endsWith('EventHandler'))) {
    return /^on[A-Z]/.test(prop.name) ? { kind: 'event' } : { kind: 'omitted', reason: 'function' }
  }
  if (isNodeRef(t) || (t.kind === 'union' && t.members.some(isNodeRef))) {
    return { kind: 'slot', arity: prop.name === 'children' ? 'many' : 'one' }
  }
  const schema = toJsonSchema(t, ctx, true)
  if (!schema) return { kind: 'omitted', reason: 'unresolved-type' }
  const parsed = prop.default === undefined ? undefined : parseDefault(prop.default, schema)
  return {
    kind: 'data',
    schema,
    ...(prop.description ? { description: prop.description } : {}),
    ...(parsed ? { default: parsed.value } : {}),
  }
}

function unquote(raw: string): string {
  const m = /^(['"])(.*)\1$/.exec(raw)
  return m?.[2] ?? raw
}

/** undefined when the manifest's default text isn't a literal valid for the schema (e.g. '16 / 9'). */
export function parseDefault(raw: string, schema: JsonSchema): { value: unknown } | undefined {
  const text = raw.trim()
  const choices = Array.isArray(schema['enum']) ? schema['enum'] : undefined
  const allowed = (v: unknown): { value: unknown } | undefined =>
    !choices || choices.includes(v) ? { value: v } : undefined
  switch (schema['type']) {
    case 'boolean':
      return text === 'true' || text === 'false' ? allowed(text === 'true') : undefined
    case 'number': {
      const n = Number(text)
      return text !== '' && Number.isFinite(n) ? allowed(n) : undefined
    }
    case 'string':
      return allowed(unquote(text))
    case 'array':
    case 'object': {
      let v: unknown
      try {
        v = JSON.parse(text)
      } catch {
        return undefined
      }
      const isArray = Array.isArray(v)
      const ok =
        schema['type'] === 'array' ? isArray : typeof v === 'object' && v !== null && !isArray
      return ok ? { value: v } : undefined
    }
    default:
      return undefined
  }
}
