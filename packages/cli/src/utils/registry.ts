export interface RegistryComponent {
  name: string
  type?: 'component' | 'layout' | 'block' | 'chart' | 'section'
  description: string
  category: string
  version: string
  files: string[]
  /** npm package to install (used when type === 'chart'). */
  install?: string
  dependencies: string[]
  tags: string[]
  meta: { name: string }
}

export interface Registry {
  version: string
  generatedAt: string
  components: RegistryComponent[]
}

function asStringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((v): v is string => typeof v === 'string') : []
}

/** Validate and normalize raw JSON into a typed Registry. Throws on bad shape. */
export function parseRegistry(raw: unknown): Registry {
  if (typeof raw !== 'object' || raw === null) {
    throw new Error('Invalid registry: expected an object')
  }
  const obj = raw as Record<string, unknown>
  if (!Array.isArray(obj.components)) {
    throw new Error('Invalid registry: "components" must be an array')
  }

  const components: RegistryComponent[] = obj.components.map((entry, i) => {
    if (typeof entry !== 'object' || entry === null) {
      throw new Error(`Invalid registry: component at index ${i} is not an object`)
    }
    const c = entry as Record<string, unknown>
    if (typeof c.name !== 'string') {
      throw new Error(`Invalid registry: component at index ${i} is missing "name"`)
    }
    const rawType = c.type
    const type =
      rawType === 'component' || rawType === 'layout' || rawType === 'block' || rawType === 'chart'
        ? rawType
        : undefined
    const rawMeta = c.meta
    const metaName =
      typeof rawMeta === 'object' &&
      rawMeta !== null &&
      typeof (rawMeta as Record<string, unknown>).name === 'string'
        ? ((rawMeta as Record<string, unknown>).name as string)
        : c.name
    const result: RegistryComponent = {
      name: c.name,
      description: typeof c.description === 'string' ? c.description : '',
      category: typeof c.category === 'string' ? c.category : '',
      version: typeof c.version === 'string' ? c.version : '0.0.0',
      files: asStringArray(c.files),
      dependencies: asStringArray(c.dependencies),
      tags: asStringArray(c.tags),
      meta: { name: metaName },
    }
    if (type !== undefined) result.type = type
    if (typeof c.install === 'string') result.install = c.install
    return result
  })

  return {
    version: typeof obj.version === 'string' ? obj.version : '0.0.0',
    generatedAt: typeof obj.generatedAt === 'string' ? obj.generatedAt : '',
    components,
  }
}

/** Fetch and parse the registry from a URL. */
export async function fetchRegistry(url: string): Promise<Registry> {
  const res = await fetch(url)
  if (!res.ok) {
    throw new Error(`Failed to fetch registry from ${url}: ${res.status} ${res.statusText}`)
  }
  return parseRegistry(await res.json())
}

/**
 * Find a component by name (case-insensitive, full name or unambiguous suffix).
 *
 * Examples:
 *   "layout/app-shell" → exact match on full name
 *   "app-shell"        → suffix match if exactly one entry ends with "/app-shell"
 *   "button"           → exact match (no slash, no suffix ambiguity)
 */
export function findComponent(registry: Registry, name: string): RegistryComponent | undefined {
  const target = name.toLowerCase()

  // 1. Exact full-name match (case-insensitive).
  const exact = registry.components.find((c) => c.name.toLowerCase() === target)
  if (exact) return exact

  // 2. Suffix match: resolve "app-shell" to "layout/app-shell" when unambiguous.
  const suffix = `/${target}`
  const matches = registry.components.filter((c) => c.name.toLowerCase().endsWith(suffix))
  if (matches.length === 1) return matches[0]

  return undefined
}

/** Fuzzy-ish search over name, tags and description. */
export function searchComponents(registry: Registry, query: string): RegistryComponent[] {
  const q = query.toLowerCase()
  return registry.components.filter(
    (c) =>
      c.name.toLowerCase().includes(q) ||
      c.description.toLowerCase().includes(q) ||
      c.tags.some((t) => t.toLowerCase().includes(q)),
  )
}

/** Extract the file name from a registry file URL. */
export function fileName(url: string): string {
  const stripped = url.split(/[?#]/)[0] ?? url
  return stripped.split('/').pop() || stripped
}
