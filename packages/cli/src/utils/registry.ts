import { fetchJsonFresh } from './http.js'

export interface RegistryComponent {
  name: string
  type?: 'component' | 'layout' | 'block' | 'chart' | 'section'
  description: string
  category: string
  version: string
  files: string[]
  /** filename → sha256 of upstream content — used by `update --check`. */
  fileHashes?: Record<string, string>
  /** npm package to install (used when type === 'chart'). */
  install?: string
  dependencies: string[]
  /** Other registry components to install transitively (shared hooks/siblings). */
  registryDependencies?: string[]
  tags: string[]
  meta: { name: string }
}

export interface BlockRegistryEntry {
  name: string
  type: 'block'
  displayName: string
  description: string
  category: string
  version: string
  files: string[]
  dependencies: string[]
  tags: string[]
  screenshot: { light: string; dark: string }
}

export interface Registry {
  version: string
  generatedAt: string
  components: RegistryComponent[]
  blocks?: BlockRegistryEntry[]
  /** Names of first-party templates — installed via the per-item path (r/<name>.json). */
  templates: string[]
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
    if (Array.isArray(c.registryDependencies)) {
      const deps = asStringArray(c.registryDependencies)
      if (deps.length > 0) result.registryDependencies = deps
    }
    if (typeof c.fileHashes === 'object' && c.fileHashes !== null) {
      const hashes: Record<string, string> = {}
      for (const [file, hash] of Object.entries(c.fileHashes as Record<string, unknown>)) {
        if (typeof hash === 'string') hashes[file] = hash
      }
      if (Object.keys(hashes).length > 0) result.fileHashes = hashes
    }
    return result
  })

  const blocks: BlockRegistryEntry[] = Array.isArray(obj.blocks)
    ? obj.blocks.flatMap((entry) => {
        if (typeof entry !== 'object' || entry === null) return []
        const b = entry as Record<string, unknown>
        if (typeof b.name !== 'string') return []
        const rawScreenshot =
          typeof b.screenshot === 'object' && b.screenshot !== null
            ? (b.screenshot as Record<string, unknown>)
            : {}
        return [
          {
            name: b.name,
            type: 'block' as const,
            displayName: typeof b.displayName === 'string' ? b.displayName : b.name,
            description: typeof b.description === 'string' ? b.description : '',
            category: typeof b.category === 'string' ? b.category : '',
            version: typeof b.version === 'string' ? b.version : '0.0.0',
            files: asStringArray(b.files),
            dependencies: asStringArray(b.dependencies),
            tags: asStringArray(b.tags),
            screenshot: {
              light: typeof rawScreenshot.light === 'string' ? rawScreenshot.light : '',
              dark: typeof rawScreenshot.dark === 'string' ? rawScreenshot.dark : '',
            },
          },
        ]
      })
    : []

  const templates: string[] = Array.isArray(obj.templates)
    ? obj.templates.flatMap((entry) => {
        if (typeof entry !== 'object' || entry === null) return []
        const name = (entry as Record<string, unknown>).name
        return typeof name === 'string' ? [name] : []
      })
    : []

  return {
    version: typeof obj.version === 'string' ? obj.version : '0.0.0',
    generatedAt: typeof obj.generatedAt === 'string' ? obj.generatedAt : '',
    components,
    blocks,
    templates,
  }
}

/**
 * Fetch and parse the registry from a URL. Retries transient failures and
 * falls back to the last cached copy when offline (via fetchJsonFresh).
 */
export async function fetchRegistry(url: string): Promise<Registry> {
  try {
    return parseRegistry(await fetchJsonFresh(url))
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    throw new Error(`Failed to fetch registry from ${url}: ${msg}`)
  }
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

  // Handle block/ prefix: look up in the blocks array.
  if (target.startsWith('block/')) {
    const blockName = target.slice('block/'.length)
    const block = (registry.blocks ?? []).find((b) => b.name.toLowerCase() === blockName)
    if (!block) throw new Error(`Block "${blockName}" not found in registry.`)
    return block as unknown as RegistryComponent
  }

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
