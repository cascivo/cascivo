export interface PropInfo {
  name: string
  type: string
  required: boolean
}

export interface ComponentInfo {
  props: PropInfo[]
  /** True if any prop has required: true */
  hasRequiredProps: boolean
  /**
   * Props that have required: true, EXCLUDING `children`. A component's children arrive as
   * JSX element content, not as an attribute, and the audit's prop scan only ever sees the
   * opening tag — so a required `children` reported every correct usage as missing. It is
   * checked separately, via the self-closing flag.
   */
  requiredProps: string[]
  /** True when the component's manifest marks `children` required. */
  requiresChildren: boolean
  /** True if the component declares user-facing chrome text (intent.content) */
  hasContent: boolean
  /**
   * Number of distinct registry entries that share this display name. More than one means
   * the name is ambiguous (`AppShell` is both the npm component and the copy-paste
   * `layout/app-shell`, with different prop surfaces) and the props below are the UNION —
   * see `buildContract`.
   */
  entryCount: number
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

  // Several registry entries share a display name — `AppShell` is both the npm component
  // (props: header/nav/children/…) and the copy-paste `layout/app-shell` (props:
  // header/sideNav/aside/persistKey/…), and `Calendar` is both the component and the chart.
  // Keying a Map by name meant the last one won, so every adopter of `@cascivo/react`'s
  // AppShell was audited against a component they don't have: `nav` came back as an
  // "unknown prop" and `sideNav` was the only recognised slot.
  //
  // A JSX name alone cannot tell the entries apart, so the contract merges them: props are
  // the UNION (no false `unknown-prop`), and `required` only survives when EVERY entry with
  // that name requires it (no false `missing-prop`).
  const byName = new Map<string, RegistryComponentMeta[]>()
  for (const entry of input.registry.components) {
    const meta = entry.meta
    if (!meta?.name) continue
    const list = byName.get(meta.name)
    if (list) list.push(meta)
    else byName.set(meta.name, [meta])
  }

  const components = new Map<string, ComponentInfo>()
  for (const [name, metas] of byName) {
    const props = new Map<string, PropInfo>()
    for (const meta of metas) {
      for (const p of meta.props ?? []) {
        const existing = props.get(p.name)
        // Required only if required in every entry that declares the prop.
        const required = (existing?.required ?? true) && p.required === true
        props.set(p.name, { name: p.name, type: p.type ?? 'unknown', required })
      }
    }
    // A prop absent from one of the entries can't be required overall.
    if (metas.length > 1) {
      for (const [propName, info] of props) {
        const inEvery = metas.every((m) => (m.props ?? []).some((p) => p.name === propName))
        if (!inEvery) props.set(propName, { ...info, required: false })
      }
    }
    const all = [...props.values()]
    // `children` is element content, not an attribute — tracked separately.
    const requiredProps = all.filter((p) => p.required && p.name !== 'children').map((p) => p.name)
    components.set(name, {
      props: all,
      requiredProps,
      hasRequiredProps: requiredProps.length > 0,
      requiresChildren: all.some((p) => p.name === 'children' && p.required),
      hasContent: contentNames.has(name),
      entryCount: metas.length,
    })
  }

  return { tokensByValue, components }
}
