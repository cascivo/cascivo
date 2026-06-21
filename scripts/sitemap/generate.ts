#!/usr/bin/env node
/**
 * Generates the docs sitemap.xml from registry.json.
 * Reads registry.json and outputs to apps/docs/public/sitemap.xml.
 *
 * Output is deterministic (no timestamps) so the drift check stays green.
 */

import { readFileSync, writeFileSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, '..', '..')
const REGISTRY_PATH = join(ROOT, 'registry.json')
const OUT_PATH = join(ROOT, 'apps', 'docs', 'public', 'sitemap.xml')

const SITE_URL = 'https://docs.cascivo.com'

/** Indexable static routes, in priority order. Kept in sync with src/seo.ts. */
const STATIC_ROUTES: { path: string; priority: string }[] = [
  { path: '/', priority: '1.0' },
  { path: '/why', priority: '0.8' },
  { path: '/ai', priority: '0.8' },
  { path: '/directory', priority: '0.8' },
  { path: '/context', priority: '0.8' },
  { path: '/charts', priority: '0.7' },
  { path: '/layouts', priority: '0.7' },
  { path: '/benchmarks', priority: '0.7' },
  { path: '/parity', priority: '0.7' },
  { path: '/migrating', priority: '0.7' },
  { path: '/brand', priority: '0.6' },
]

interface RegistryEntry {
  name: string
}

const registry = JSON.parse(readFileSync(REGISTRY_PATH, 'utf8')) as { components: RegistryEntry[] }

const componentNames = registry.components.map((c) => c.name).sort((a, b) => a.localeCompare(b))

function urlEntry(loc: string, priority: string): string {
  return `  <url>\n    <loc>${loc}</loc>\n    <priority>${priority}</priority>\n  </url>`
}

const entries = [
  ...STATIC_ROUTES.map((r) => urlEntry(`${SITE_URL}${r.path}`, r.priority)),
  ...componentNames.map((name) => urlEntry(`${SITE_URL}/components/${name}`, '0.6')),
]

const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${entries.join('\n')}
</urlset>
`

writeFileSync(OUT_PATH, xml)
console.log(`sitemap: wrote ${entries.length} urls to ${OUT_PATH}`)
