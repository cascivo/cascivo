#!/usr/bin/env node
/**
 * Generates the single sitemap.xml for the unified site (cascivo.com):
 *   - marketing routes   from apps/site/src/marketing/route-head.ts (PRERENDER_ROUTES)
 *   - docs static routes  (under /docs), kept in sync with apps/site/src/seo.ts
 *   - docs component pages from registry.json (under /docs/components/<name>)
 *
 * Both surfaces now live in one app at one domain, so there is one sitemap.
 * Output is deterministic (no timestamps) so the drift check stays green; run as
 * part of `pnpm regen`.
 */

import { readFileSync, writeFileSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  PRERENDER_ROUTES,
  canonicalFor,
  SITE_URL,
} from '../../apps/site/src/marketing/route-head.ts'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, '..', '..')
const REGISTRY_PATH = join(ROOT, 'registry.json')
const OUT_PATH = join(ROOT, 'apps', 'site', 'public', 'sitemap.xml')

/** Indexable static docs routes (under /docs), in priority order. */
const DOCS_STATIC_ROUTES: { path: string; priority: string }[] = [
  { path: '/docs', priority: '0.9' },
  { path: '/docs/why', priority: '0.8' },
  { path: '/docs/faq', priority: '0.7' },
  { path: '/docs/platform', priority: '0.7' },
  { path: '/docs/ai', priority: '0.8' },
  { path: '/docs/directory', priority: '0.8' },
  { path: '/docs/context', priority: '0.8' },
  { path: '/docs/charts', priority: '0.7' },
  { path: '/docs/icons', priority: '0.7' },
  { path: '/docs/layouts', priority: '0.7' },
  { path: '/docs/benchmarks', priority: '0.7' },
  { path: '/docs/parity', priority: '0.7' },
  { path: '/docs/migrating', priority: '0.7' },
  { path: '/docs/changelog', priority: '0.6' },
  { path: '/docs/keyboard', priority: '0.6' },
  { path: '/docs/brand', priority: '0.6' },
]

interface RegistryEntry {
  name: string
}

function urlEntry(loc: string, priority: string): string {
  return `  <url>\n    <loc>${loc}</loc>\n    <priority>${priority}</priority>\n  </url>`
}

function sitemap(entries: string[]): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${entries.join('\n')}
</urlset>
`
}

const registry = JSON.parse(readFileSync(REGISTRY_PATH, 'utf8')) as { components: RegistryEntry[] }
const componentNames = registry.components.map((c) => c.name).sort((a, b) => a.localeCompare(b))

// Home first (1.0), then marketing routes, then docs static routes + components.
const marketingRoutes = [
  { path: '/', priority: '1.0' },
  ...PRERENDER_ROUTES.map((route) => ({
    path: `/${route}`,
    priority: route.includes('/') ? '0.7' : '0.8',
  })),
]

const entries = [
  ...marketingRoutes.map((r) => urlEntry(canonicalFor(r.path), r.priority)),
  ...DOCS_STATIC_ROUTES.map((r) => urlEntry(`${SITE_URL}${r.path}`, r.priority)),
  ...componentNames.map((name) => urlEntry(`${SITE_URL}/docs/components/${name}`, '0.6')),
]

writeFileSync(OUT_PATH, sitemap(entries))
console.log(`sitemap: wrote ${entries.length} urls to ${OUT_PATH}`)
