import { existsSync, readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

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

const HERE = dirname(fileURLToPath(import.meta.url))

const EMPTY: MarketplaceCatalog = {
  generatedAt: '',
  templates: [],
  facets: { categories: [], frameworks: [], tags: [] },
}

/**
 * Resolve the marketplace catalog location. Checks, in order: an explicit path,
 * the `CASCIVO_MARKETPLACE_PATH` env var, a copy bundled next to the built
 * server, and the in-repo `apps/site/public/marketplace.json` (dev).
 */
export function resolveCatalogPath(explicit?: string): string {
  const candidates = [
    explicit,
    process.env.CASCIVO_MARKETPLACE_PATH,
    join(HERE, 'marketplace.json'),
    join(HERE, '..', '..', '..', 'apps', 'site', 'public', 'marketplace.json'),
    join(HERE, '..', '..', 'apps', 'site', 'public', 'marketplace.json'),
  ].filter((p): p is string => typeof p === 'string' && p.length > 0)

  return candidates.find((p) => existsSync(p)) ?? candidates[candidates.length - 1] ?? ''
}

/** Load the marketplace catalog, returning an empty catalog if none is found. */
export function loadCatalog(explicit?: string): MarketplaceCatalog {
  const path = resolveCatalogPath(explicit)
  if (!path || !existsSync(path)) return EMPTY
  try {
    return JSON.parse(readFileSync(path, 'utf8')) as MarketplaceCatalog
  } catch {
    return EMPTY
  }
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
