export interface PropInfo {
  name: string
  type: string
  required: boolean
}

export interface ComponentInfo {
  props: PropInfo[]
  /** True if any prop has required: true */
  hasRequiredProps: boolean
  /** Props that have required: true */
  requiredProps: string[]
  /** True if the component declares user-facing chrome text (intent.content) */
  hasContent: boolean
}

export interface Contract {
  /** Map from normalized color/size value → token names */
  tokensByValue: Map<string, string[]>
  /** Map from component name (PascalCase) → component info */
  components: Map<string, ComponentInfo>
}

interface TokenEntry {
  name: string
  resolvedDefault: string | null
}

interface CatalogFile {
  tokens: TokenEntry[]
}

interface RegistryPropMeta {
  name: string
  type?: string
  required?: boolean
}

interface RegistryComponentMeta {
  name: string
  props?: RegistryPropMeta[]
}

interface RegistryEntry {
  meta?: RegistryComponentMeta
}

interface RegistryFile {
  components: RegistryEntry[]
}

interface ContextComponentEntry {
  name: string
  intent?: { content?: unknown }
}

interface ContextFile {
  components: ContextComponentEntry[]
}

export interface BuildContractInput {
  catalog: CatalogFile
  registry: RegistryFile
  context: ContextFile
}

/** Normalize a color/size value for catalog comparison: lowercase, strip spaces. */
export function normalizeValue(value: string): string {
  return value.toLowerCase().replace(/\s+/g, '')
}

/** Pure builder — assemble a Contract from already-parsed JSON. Testable without fs. */
export function buildContract(input: BuildContractInput): Contract {
  const tokensByValue = new Map<string, string[]>()
  for (const token of input.catalog.tokens) {
    if (token.resolvedDefault == null) continue
    const key = normalizeValue(token.resolvedDefault)
    const list = tokensByValue.get(key)
    if (list) list.push(token.name)
    else tokensByValue.set(key, [token.name])
  }

  const contentNames = new Set<string>()
  for (const c of input.context.components) {
    if (c.intent?.content) contentNames.add(c.name)
  }

  const components = new Map<string, ComponentInfo>()
  for (const entry of input.registry.components) {
    const meta = entry.meta
    if (!meta?.name) continue
    const props: PropInfo[] = (meta.props ?? []).map((p) => ({
      name: p.name,
      type: p.type ?? 'unknown',
      required: p.required === true,
    }))
    const requiredProps = props.filter((p) => p.required).map((p) => p.name)
    components.set(meta.name, {
      props,
      requiredProps,
      hasRequiredProps: requiredProps.length > 0,
      hasContent: contentNames.has(meta.name),
    })
  }

  return { tokensByValue, components }
}
