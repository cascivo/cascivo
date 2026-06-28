import type { RegistryItem, TemplateScreenshot } from './types.ts'
import { isTemplateItem, asTemplateMeta } from './template.ts'

/** A template projected into a flat, gallery-ready record. */
export interface MarketplaceTemplate {
  name: string
  namespace: string
  description: string
  category: string
  framework: string
  tags: string[]
  screenshots: TemplateScreenshot[]
  demoUrl?: string
  version: string
  license: string
  verified: boolean
  homepage?: string
  /** The spec a user passes to `cascivo add` (e.g. "@acme/dashboard"). */
  installSpec: string
  /** GitHub stars, baked at CI build time (omitted when unknown). */
  stars?: number
}

/** The static marketplace catalog written to `apps/site/public/marketplace.json`. */
export interface MarketplaceCatalog {
  generatedAt: string
  templates: MarketplaceTemplate[]
  facets: { categories: string[]; frameworks: string[]; tags: string[] }
}

/** One registry's resolved index + the directory metadata that referenced it. */
export interface MarketplaceSource {
  entry: { namespace: string; verified?: boolean; homepage?: string; stars?: number }
  items: RegistryItem[]
}

/**
 * Project a template item into a gallery record, or `null` if the item is not a
 * valid template. Pure — no I/O.
 */
export function projectTemplate(
  item: RegistryItem,
  source: MarketplaceSource['entry'],
): MarketplaceTemplate | null {
  if (!isTemplateItem(item)) return null
  let meta
  try {
    meta = asTemplateMeta(item.meta)
  } catch {
    return null
  }
  const record: MarketplaceTemplate = {
    name: item.name,
    namespace: source.namespace,
    description: item.description,
    category: meta.category,
    framework: meta.framework,
    tags: item.tags ?? [],
    screenshots: meta.screenshots,
    version: item.version,
    license: item.license ?? '',
    verified: source.verified ?? false,
    installSpec: `${source.namespace}/${item.name}`,
  }
  if (meta.demoUrl) record.demoUrl = meta.demoUrl
  const homepage = item.homepage ?? source.homepage
  if (homepage) record.homepage = homepage
  if (typeof source.stars === 'number') record.stars = source.stars
  return record
}

function uniqueSorted(values: string[]): string[] {
  return [...new Set(values)].sort((a, b) => a.localeCompare(b))
}

/**
 * Build the marketplace catalog from a set of resolved registry sources. Pure —
 * the caller does the fetching + star lookups and supplies the timestamp.
 * Templates are sorted verified-first, then by stars (desc), then by name.
 */
export function buildCatalog(
  sources: MarketplaceSource[],
  generatedAt: string,
): MarketplaceCatalog {
  const templates: MarketplaceTemplate[] = []
  for (const src of sources) {
    for (const item of src.items) {
      const record = projectTemplate(item, src.entry)
      if (record) templates.push(record)
    }
  }

  templates.sort((a, b) => {
    if (a.verified !== b.verified) return a.verified ? -1 : 1
    const sa = a.stars ?? 0
    const sb = b.stars ?? 0
    if (sa !== sb) return sb - sa
    return a.name.localeCompare(b.name)
  })

  return {
    generatedAt,
    templates,
    facets: {
      categories: uniqueSorted(templates.map((t) => t.category)),
      frameworks: uniqueSorted(templates.map((t) => t.framework)),
      tags: uniqueSorted(templates.flatMap((t) => t.tags)),
    },
  }
}
