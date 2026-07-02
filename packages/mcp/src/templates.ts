import { existsSync, readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { CASCIVO_HOST } from './host.js'

/** A template record as stored in the static marketplace catalog. */
export interface MarketplaceTemplate {
  name: string
  namespace: string
  description: string
  category: string
  framework: string
  tags: string[]
  components: string[]
  screenshots: { light: string; dark?: string; alt: string }[]
  demoUrl?: string
  version: string
  license: string
  verified: boolean
  homepage?: string
  installSpec: string
  stars?: number
}

export interface MarketplaceCatalog {
  generatedAt: string
  templates: MarketplaceTemplate[]
  facets: { categories: string[]; frameworks: string[]; tags: string[] }
}

type FetchFn = (url: string, init?: RequestInit) => Promise<Response>

const HERE = dirname(fileURLToPath(import.meta.url))
const CATALOG_BASE_URL = CASCIVO_HOST

/**
 * Resolve a local marketplace catalog. Checks, in order: an explicit path,
 * the `CASCIVO_MARKETPLACE_PATH` env var, a copy bundled next to the built
 * server, and the in-repo `apps/site/public/marketplace.json` (dev).
 * Returns null when no candidate exists on disk.
 */
export function resolveCatalogPath(explicit?: string): string | null {
  const candidates = [
    explicit,
    process.env.CASCIVO_MARKETPLACE_PATH,
    join(HERE, 'marketplace.json'),
    join(HERE, '..', '..', '..', 'apps', 'site', 'public', 'marketplace.json'),
    join(HERE, '..', '..', 'apps', 'site', 'public', 'marketplace.json'),
  ].filter((p): p is string => typeof p === 'string' && p.length > 0)

  return candidates.find((p) => existsSync(p)) ?? null
}

/**
 * Load the marketplace catalog: bundled/local copy first, then the hosted one.
 * Throws when neither is available — an empty catalog would silently make
 * every template invisible, which is worse than a visible error.
 */
export async function loadCatalog(
  explicit?: string,
  fetchFn?: FetchFn,
): Promise<MarketplaceCatalog> {
  const path = resolveCatalogPath(explicit)
  if (path) {
    try {
      return JSON.parse(readFileSync(path, 'utf8')) as MarketplaceCatalog
    } catch {
      // Unreadable local copy — fall through to the network.
    }
  }
  const url = `${CATALOG_BASE_URL}/marketplace.json`
  const fn = fetchFn ?? fetch
  let res: Response
  try {
    res = await fn(url)
  } catch (e) {
    throw new Error(
      `Marketplace catalog unavailable: no local copy and ${url} unreachable (${e instanceof Error ? e.message : e})`,
    )
  }
  if (!res.ok) {
    throw new Error(
      `Marketplace catalog unavailable: no local copy and ${url} returned ${res.status}`,
    )
  }
  return res.json() as Promise<MarketplaceCatalog>
}

export interface TemplateFilter {
  category?: string
  tag?: string
  framework?: string
  verifiedOnly?: boolean
}

/** Filter the catalog's templates. Pure. */
export function listTemplates(
  catalog: MarketplaceCatalog,
  filter: TemplateFilter = {},
): MarketplaceTemplate[] {
  return catalog.templates.filter((t) => {
    if (filter.category && t.category !== filter.category) return false
    if (filter.framework && t.framework !== filter.framework) return false
    if (filter.verifiedOnly && !t.verified) return false
    if (filter.tag && !t.tags.includes(filter.tag)) return false
    return true
  })
}

/** Find one template by name or installSpec. Pure. */
export function getTemplate(
  catalog: MarketplaceCatalog,
  name: string,
): MarketplaceTemplate | undefined {
  return catalog.templates.find((t) => t.name === name || t.installSpec === name)
}
