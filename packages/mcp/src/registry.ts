import { existsSync, readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

export interface PropManifest {
  name: string
  type: string
  required: boolean
  default?: string
  description?: string
}

export interface ComponentManifest {
  name: string
  description: string
  category: string
  states: string[]
  variants: string[]
  sizes: string[]
  props: PropManifest[]
  tokens: string[]
  accessibility: { role: string; wcag: string; keyboard: string[] }
  examples: { title: string; code: string; description?: string }[]
  dependencies: string[]
  tags: string[]
}

export interface RegistryComponent {
  name: string
  type?: 'component' | 'layout' | 'block' | 'chart' | 'section'
  description: string
  category: string
  version: string
  files: string[]
  dependencies: string[]
  tags: string[]
  meta: ComponentManifest
}

export interface Registry {
  version: string
  generatedAt: string
  components: RegistryComponent[]
}

const HERE = dirname(fileURLToPath(import.meta.url))

/**
 * Resolve the registry.json location. Checks, in order: an explicit path, the
 * `CASCADE_REGISTRY_PATH` env var, a copy bundled next to the built server
 * (published package), and the monorepo root (dev).
 */
export function resolveRegistryPath(explicit?: string): string {
  const candidates = [
    explicit,
    process.env.CASCADE_REGISTRY_PATH,
    join(HERE, 'registry.json'),
    join(HERE, '..', '..', '..', 'registry.json'),
    join(HERE, '..', '..', 'registry.json'),
  ].filter((p): p is string => typeof p === 'string' && p.length > 0)

  return (
    candidates.find((p) => existsSync(p)) ?? candidates[candidates.length - 1] ?? 'registry.json'
  )
}

export function loadRegistry(path?: string): Registry {
  const resolved = resolveRegistryPath(path)
  const raw = JSON.parse(readFileSync(resolved, 'utf8')) as Registry
  if (!Array.isArray(raw.components)) {
    throw new Error(`Invalid registry at ${resolved}: "components" must be an array`)
  }
  return raw
}

/** List component manifests, optionally filtered by category and/or type. */
export function listComponents(
  registry: Registry,
  category?: string,
  type?: string,
): ComponentManifest[] {
  let entries = registry.components
  if (category) entries = entries.filter((c) => c.category === category)
  if (type) entries = entries.filter((c) => c.type === type)
  return entries.map((c) => c.meta)
}

/** Find one component manifest by name (matches registry name or meta name). */
export function getComponent(registry: Registry, name: string): ComponentManifest | undefined {
  const target = name.toLowerCase()
  return registry.components.find(
    (c) => c.name.toLowerCase() === target || c.meta.name.toLowerCase() === target,
  )?.meta
}

// ---------------------------------------------------------------------------
// Multi-registry support
// ---------------------------------------------------------------------------

export interface RegistryDirectoryEntry {
  namespace: string
  name: string
  description?: string
  registryUrl: string
  verified?: boolean
  homepage?: string
}

const DIRECTORY_URL = 'https://cascade-ui.dev/r/registries.json'
const FETCH_TIMEOUT_MS = 15_000
const MAX_BODY_BYTES = 1_048_576 // 1 MB

type FetchFn = (url: string, init?: RequestInit) => Promise<Response>

async function fetchWithGuards(url: string, fetchFn: FetchFn = fetch): Promise<string | null> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS)
  try {
    const res = await fetchFn(url, { signal: controller.signal })
    if (!res.ok) return null
    const buf = await res.arrayBuffer()
    if (buf.byteLength > MAX_BODY_BYTES) return null
    return new TextDecoder().decode(buf)
  } catch {
    return null
  } finally {
    clearTimeout(timer)
  }
}

/** Fetch the central cascade registry directory. Returns empty array on failure. */
export async function fetchDirectory(fetchFn?: FetchFn): Promise<RegistryDirectoryEntry[]> {
  const raw = await fetchWithGuards(DIRECTORY_URL, fetchFn)
  if (!raw) return []
  try {
    const parsed = JSON.parse(raw) as unknown
    if (!Array.isArray(parsed)) return []
    return parsed as RegistryDirectoryEntry[]
  } catch {
    return []
  }
}

/** Fetch the component index from a namespace's registryUrl. Returns null on failure. */
export async function fetchRegistryIndex(
  registryUrl: string,
  fetchFn?: FetchFn,
): Promise<Registry | null> {
  // Resolve the registry.json URL: replace trailing `{name}` template or append /registry.json
  const indexUrl = registryUrl.includes('{name}')
    ? registryUrl.replace('{name}', 'registry').replace(/\/registry$/, '/registry.json')
    : registryUrl.replace(/\/?$/, '/registry.json').replace(/\/\/registry\.json$/, '/registry.json')
  const raw = await fetchWithGuards(indexUrl, fetchFn)
  if (!raw) return null
  try {
    const parsed = JSON.parse(raw) as Registry
    if (!Array.isArray(parsed.components)) return null
    return parsed
  } catch {
    return null
  }
}

/** Parse CASCADE_REGISTRIES env var — returns empty array on failure. */
export function getEnvRegistries(): RegistryDirectoryEntry[] {
  const raw = process.env['CASCADE_REGISTRIES']
  if (!raw) return []
  try {
    const parsed = JSON.parse(raw) as unknown
    if (!Array.isArray(parsed)) return []
    return parsed as RegistryDirectoryEntry[]
  } catch {
    return []
  }
}

/** Merge directory entries with env entries (env wins on namespace collision). */
export function mergeRegistries(
  directory: RegistryDirectoryEntry[],
  env: RegistryDirectoryEntry[],
): RegistryDirectoryEntry[] {
  const map = new Map<string, RegistryDirectoryEntry>()
  for (const entry of directory) map.set(entry.namespace, entry)
  for (const entry of env) map.set(entry.namespace, entry)
  return Array.from(map.values())
}

/** Fuzzy search over name, tags, and description. */
export function searchComponents(registry: Registry, query: string): ComponentManifest[] {
  const q = query.toLowerCase().trim()
  if (q === '') return []
  return registry.components
    .filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.description.toLowerCase().includes(q) ||
        c.tags.some((t) => t.toLowerCase().includes(q)),
    )
    .map((c) => c.meta)
}
