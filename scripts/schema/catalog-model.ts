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
  /** Schema for a ReactNode inside data (default `{ type: 'string' }`); validators widen it. */
  nodeInData?: JsonSchema
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
  let dropped = false
  for (const f of fields) {
    const s = f.type ? convert(f.type, ctx, inData, seen) : null
    if (!s) {
      // An unrepresentable required field would make every instance invalid, so the whole object goes.
      if (f.required) return null
      dropped = true
      continue
    }
    properties[f.name] = f.description ? { ...s, description: f.description } : s
    if (f.required) required.push(f.name)
  }
  return {
    type: 'object',
    properties,
    ...(required.length > 0 ? { required } : {}),
    // A dropped optional field is legal but undescribable, so the object must stay open for it.
    ...(dropped ? {} : { additionalProperties: false }),
  }
}

function refSchema(
  t: Extract<TsType, { kind: 'ref' }>,
  ctx: ResolveContext,
  inData: boolean,
  seen: ReadonlySet<string>,
): JsonSchema | null {
  if (NODE_REFS.has(t.name)) return inData ? (ctx.nodeInData ?? { type: 'string' }) : null
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

/** `(() => void) | undefined` is still a function prop; unwrap optionality before classifying. */
function withoutUndefined(t: TsType): TsType {
  if (t.kind !== 'union') return t
  const rest = t.members.filter((m) => !(m.kind === 'primitive' && m.name === 'undefined'))
  const [only] = rest
  return rest.length === 1 && only ? only : { kind: 'union', members: rest }
}

export function classifyProp(prop: PropMeta, ctx: ResolveContext): PropClass {
  const parsedType = parseTsType(prop.type)
  if (!parsedType) return { kind: 'omitted', reason: 'unparseable' }
  const t = withoutUndefined(parsedType)
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
  // The manifest writes `undefined` for "no default"; it is never a value.
  if (text === 'undefined') return undefined
  const branches = schema['anyOf']
  if (Array.isArray(branches)) {
    // Plain strings accept anything, so they go last or 'false' / '12' / 'null' would be swallowed.
    const rank = (b: JsonSchema): number =>
      b['type'] !== 'string' ? 0 : Array.isArray(b['enum']) ? 1 : 2
    const ordered = branches
      .filter((b): b is JsonSchema => typeof b === 'object' && b !== null)
      .sort((a, b) => rank(a) - rank(b))
    for (const b of ordered) {
      const r = parseDefault(raw, b)
      if (r) return r
    }
    return undefined
  }
  const choices = Array.isArray(schema['enum']) ? schema['enum'] : undefined
  const allowed = (v: unknown): { value: unknown } | undefined =>
    !choices || choices.includes(v) ? { value: v } : undefined
  switch (schema['type']) {
    case 'boolean':
      return text === 'true' || text === 'false' ? allowed(text === 'true') : undefined
    case 'null':
      return text === 'null' ? { value: null } : undefined
    case 'number': {
      const n = Number(text)
      return text !== '' && Number.isFinite(n) ? allowed(n) : undefined
    }
    case 'string':
      // Unquoted null is the JS value, not the string "null".
      return text === 'null' ? undefined : allowed(unquote(text))
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

// ---------------------------------------------------------------------------
// Catalog
// ---------------------------------------------------------------------------

export interface CatalogComponent {
  description: string
  category: string
  parent?: string
  intent?: { whenToUse?: unknown; whenNotToUse?: unknown }
  props: {
    type: 'object'
    properties: Record<string, JsonSchema>
    required?: string[]
    additionalProperties: false
  }
  /** `text`: the slot also takes plain text (ViewConfig's `children: string | TranslationRef`). */
  slots: Record<
    string,
    { arity: 'one' | 'many'; required: boolean; description?: string; text?: true }
  >
  events: Record<string, { description?: string }>
  omitted: Record<string, { type: string; reason: string }>
}

export interface Catalog {
  $id: string
  version: 1
  components: Record<string, CatalogComponent>
}

export const CATALOG_ID =
  'https://raw.githubusercontent.com/cascivo/cascivo/main/packages/render/schema/catalog.v1.json'

/** Renderable names that have no registry entry of their own. A new one fails regen until listed here. */
export const SUBCOMPONENT_PARENT: Readonly<Record<string, string>> = {
  CardContent: 'Card',
  CardFooter: 'Card',
  CardHeader: 'Card',
  CardTitle: 'Card',
  GridItem: 'Grid',
  ListItem: 'List',
  RadioCardGroup: 'RadioCard',
}

/**
 * Parent manifest props a sub-component takes too (the manifest has no per-part section), and
 * props only the part has. A parent prop becomes optional on the part (the
 * parent's `value` is the card's own, and required).
 *
 * `extra` props are declared here, not in the manifest, on purpose: RadioCard's source paints
 * a `<label>` element, so a `label` prop in that manifest cannot satisfy both the
 * nameVisibility parity guard (it reads the whole file) and the group's real behaviour
 * (an invisible aria-label).
 */
export const SUBCOMPONENT_PROPS: Readonly<
  Record<string, { optional: readonly string[]; extra: readonly PropMeta[] }>
> = {
  RadioCardGroup: {
    optional: ['defaultValue', 'onValueChange', 'value'],
    extra: [
      {
        name: 'name',
        type: 'string',
        required: true,
        description: 'The radio group name shared by its cards',
      },
      {
        name: 'label',
        type: 'string',
        required: true,
        description: 'Accessible name of the group, applied as aria-label and not painted',
      },
      {
        name: 'className',
        type: 'string',
        required: false,
        description: 'Class name for the group element, as RadioCardGroupProps declares',
      },
    ],
  },
}

/** Prefer the node-usable `component` entry when a meta.name is shared (AppShell/Stack). */
const TYPE_RANK: Record<string, number> = {
  component: 0,
  block: 1,
  chart: 2,
  section: 3,
  layout: 4,
}

export interface CatalogEntry {
  type: string
  files: string[]
  meta: {
    name: string
    description: string
    category: string
    props: PropMeta[]
    typeDefs: TypeDefMeta[] | undefined
    intent: { whenToUse?: unknown; whenNotToUse?: unknown } | undefined
  }
}

const isRecord = (v: unknown): v is Record<string, unknown> =>
  typeof v === 'object' && v !== null && !Array.isArray(v)

function str(v: unknown, path: string): string {
  if (typeof v !== 'string') throw new Error(`${path}: expected a string`)
  return v
}

function optStr(v: unknown, path: string): string | undefined {
  return v === undefined ? undefined : str(v, path)
}

function narrowProps(v: unknown, path: string): PropMeta[] {
  if (v === undefined) return []
  if (!Array.isArray(v)) throw new Error(`${path}: expected an array`)
  return v.map((p: unknown, i) => {
    const at = `${path}[${i}]`
    if (!isRecord(p)) throw new Error(`${at}: expected an object`)
    const description = optStr(p['description'], `${at}.description`)
    const def = optStr(p['default'], `${at}.default`)
    return {
      name: str(p['name'], `${at}.name`),
      type: str(p['type'], `${at}.type`),
      ...(p['required'] === true ? { required: true } : {}),
      ...(def !== undefined ? { default: def } : {}),
      ...(description !== undefined ? { description } : {}),
    }
  })
}

function narrowTypeDefs(v: unknown, path: string): TypeDefMeta[] | undefined {
  if (v === undefined) return undefined
  if (!Array.isArray(v)) throw new Error(`${path}: expected an array`)
  return v.map((d: unknown, i) => {
    const at = `${path}[${i}]`
    if (!isRecord(d)) throw new Error(`${at}: expected an object`)
    const description = optStr(d['description'], `${at}.description`)
    const fields = d['fields']
    if (!Array.isArray(fields)) throw new Error(`${at}.fields: expected an array`)
    return {
      name: str(d['name'], `${at}.name`),
      ...(description !== undefined ? { description } : {}),
      fields: fields.map((f: unknown, j) => {
        const fa = `${at}.fields[${j}]`
        if (!isRecord(f)) throw new Error(`${fa}: expected an object`)
        const fd = optStr(f['description'], `${fa}.description`)
        return {
          name: str(f['name'], `${fa}.name`),
          type: str(f['type'], `${fa}.type`),
          ...(f['required'] === true ? { required: true } : {}),
          ...(fd !== undefined ? { description: fd } : {}),
        }
      }),
    }
  })
}

function narrowEntry(e: unknown, path: string): CatalogEntry {
  if (!isRecord(e)) throw new Error(`${path}: expected an object`)
  const meta = e['meta']
  if (!isRecord(meta)) throw new Error(`${path}.meta: expected an object`)
  const intent = meta['intent']
  if (intent !== undefined && !isRecord(intent))
    throw new Error(`${path}.meta.intent: expected an object`)
  return {
    type: typeof e['type'] === 'string' ? e['type'] : '',
    files: Array.isArray(e['files'])
      ? e['files'].filter((f: unknown): f is string => typeof f === 'string')
      : [],
    meta: {
      name: str(meta['name'], `${path}.meta.name`),
      description: str(meta['description'], `${path}.meta.description`),
      category: str(meta['category'], `${path}.meta.category`),
      props: narrowProps(meta['props'], `${path}.meta.props`),
      typeDefs: narrowTypeDefs(meta['typeDefs'], `${path}.meta.typeDefs`),
      intent:
        intent === undefined
          ? undefined
          : {
              ...(intent['whenToUse'] !== undefined ? { whenToUse: intent['whenToUse'] } : {}),
              ...(intent['whenNotToUse'] !== undefined
                ? { whenNotToUse: intent['whenNotToUse'] }
                : {}),
            },
    },
  }
}

/** One entry per meta.name, ranked by TYPE_RANK (ties keep the first). Narrows each entry, throwing with its path. */
export function pickCanonical(entries: readonly unknown[]): Map<string, CatalogEntry> {
  const canonical = new Map<string, CatalogEntry>()
  entries.forEach((raw, i) => {
    const entry = narrowEntry(raw, `components[${i}]`)
    const cur = canonical.get(entry.meta.name)
    if (!cur || (TYPE_RANK[entry.type] ?? 9) < (TYPE_RANK[cur.type] ?? 9)) {
      canonical.set(entry.meta.name, entry)
    }
  })
  return canonical
}

const sortKeys = <T>(o: Record<string, T>): Record<string, T> =>
  Object.fromEntries(Object.entries(o).sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0)))

function buildComponent(entry: CatalogEntry): CatalogComponent {
  const ctx = contextFor(entry.meta.typeDefs)
  const properties: Record<string, JsonSchema> = {}
  const required: string[] = []
  const slots: CatalogComponent['slots'] = {}
  const events: CatalogComponent['events'] = {}
  const omitted: CatalogComponent['omitted'] = {}
  for (const prop of entry.meta.props) {
    const c = classifyProp(prop, ctx)
    const isRequired = prop.required === true && prop.default === undefined
    switch (c.kind) {
      case 'data':
        properties[prop.name] = {
          ...c.schema,
          ...(c.description ? { description: c.description } : {}),
          ...(c.default !== undefined ? { default: c.default } : {}),
        }
        if (isRequired) required.push(prop.name)
        break
      case 'slot':
        slots[prop.name] = {
          arity: c.arity,
          required: isRequired,
          ...(prop.description ? { description: prop.description } : {}),
          // Any node's children may be a string (packages/render/src/types.ts ComponentNode).
          ...(prop.name === 'children' ? { text: true as const } : {}),
        }
        break
      case 'event':
        events[prop.name] = prop.description ? { description: prop.description } : {}
        break
      case 'omitted':
        omitted[prop.name] = { type: prop.type, reason: c.reason }
        break
    }
  }
  return {
    description: entry.meta.description,
    category: entry.meta.category,
    ...(entry.meta.intent ? { intent: entry.meta.intent } : {}),
    props: {
      type: 'object',
      properties: sortKeys(properties),
      ...(required.length > 0 ? { required } : {}),
      additionalProperties: false,
    },
    slots: sortKeys(slots),
    events: sortKeys(events),
    omitted: sortKeys(omitted),
  }
}

/** Registry file URLs of each canonical entry, for callers that need to read sources (no I/O here). */
export function canonicalFiles(registry: unknown): Map<string, string[]> {
  if (!isRecord(registry) || !Array.isArray(registry['components'])) {
    throw new Error('registry.components: expected an array')
  }
  return new Map(
    [...pickCanonical(registry['components'])].map(([name, e]) => [name, e.files] as const),
  )
}

/**
 * The registry-shaped entry of a sub-component (a part with no manifest of its own): the
 * parent's entry with the part's props. Shared by the catalog and the render-time prop schemas
 * so both see the same props. undefined when `name` is not a part or its parent is missing.
 */
export function subcomponentEntry(
  name: string,
  canonical: ReadonlyMap<string, CatalogEntry>,
): CatalogEntry | undefined {
  const parent = SUBCOMPONENT_PARENT[name]
  const parentEntry = parent ? canonical.get(parent) : undefined
  if (!parentEntry) return undefined
  const shared = SUBCOMPONENT_PROPS[name] ?? { optional: [], extra: [] }
  return {
    ...parentEntry,
    meta: {
      ...parentEntry.meta,
      intent: undefined,
      props: [
        ...parentEntry.meta.props
          .filter((p) => shared.optional.includes(p.name))
          .map(({ required: _required, ...p }) => p),
        ...shared.extra,
        { name: 'children', type: 'ReactNode' },
      ],
    },
  }
}

export function buildCatalog(registry: unknown, renderable: ReadonlySet<string>): Catalog {
  if (!isRecord(registry) || !Array.isArray(registry['components'])) {
    throw new Error('registry.components: expected an array')
  }
  const canonical = pickCanonical(registry['components'])
  const components: Record<string, CatalogComponent> = {}
  for (const name of [...renderable].sort()) {
    const entry = canonical.get(name)
    if (entry) {
      components[name] = buildComponent(entry)
      continue
    }
    const parent = SUBCOMPONENT_PARENT[name]
    const partEntry = subcomponentEntry(name, canonical)
    if (!parent || !partEntry) {
      throw new Error(`${name}: renderable but not in the registry or SUBCOMPONENT_PARENT`)
    }
    const parentEntry = canonical.get(parent)!
    const part = buildComponent(partEntry)
    components[name] = {
      ...part,
      description: `Part of ${parent}.`,
      category: parentEntry.meta.category,
      parent,
    }
  }
  return { $id: CATALOG_ID, version: 1, components }
}

const CHILDREN_USE = /^\s*children,?\s*$|[{,]\s*children\s*[,}]|\.\.\.\{?children|props\.children/m
const NEXT_DECL = /\n(?:export\s+)?(?:default\s+)?(?:function|const|interface|type|class)\s/

/** Source text from `start` up to the next top-level declaration. */
function declarationBody(source: string, start: number): string {
  const rest = source.slice(start + 1)
  const next = NEXT_DECL.exec(rest)
  return next ? rest.slice(0, next.index + 1) : rest
}

/**
 * Whether component `name`'s own declaration (or its `<name>Props` type) uses `children`.
 * Scoped so a sibling in the same file (a Provider, a Group) can't leak its children into `name`.
 * null when the declaration isn't found, so the caller can warn.
 */
export function componentUsesChildren(source: string, name: string): boolean | null {
  const decl = new RegExp(
    `(?:^|\\n)(?:export\\s+)?(?:default\\s+)?(?:function\\s+${name}\\b|const\\s+${name}\\b)`,
  ).exec(source)
  if (!decl) return null
  const parts = [declarationBody(source, decl.index)]
  const props = new RegExp(`(?:^|\\n)(?:export\\s+)?(?:interface|type)\\s+${name}Props\\b`).exec(
    source,
  )
  if (props) parts.push(declarationBody(source, props.index))
  return parts.some((t) => CHILDREN_USE.test(t))
}

/**
 * Manifests are the source of truth for slots. A component whose source renders `children`
 * must declare it, or the catalog (and every renderer built on it) silently drops its content.
 * `sourceUsesChildren` is null when no declaration was found; that case warns elsewhere.
 */
export function assertChildrenDeclared(
  name: string,
  manifestHasChildren: boolean,
  sourceUsesChildren: boolean | null,
): void {
  if (manifestHasChildren || sourceUsesChildren !== true) return
  throw new Error(
    `${name}: renders children but its manifest does not declare \`children\` — add it to ${kebab(name)}.meta.ts`,
  )
}

const kebab = (name: string): string => name.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase()
