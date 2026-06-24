#!/usr/bin/env node
/**
 * Generates the sitemap.xml files:
 *   - docs    (docs.cascivo.com)  from registry.json + the static docs routes
 *   - landing (cascivo.com)       from apps/landing/src/route-head.ts
 *
 * The landing sitemap is derived from `PRERENDER_ROUTES` — the same source of
 * truth the app router and the build-time prerender use — so it can never drift
 * from the actual set of public routes. Run as part of `pnpm regen`; the drift
 * gate (`pnpm regen && git diff --exit-code`) fails CI if a new route was added
 * without regenerating.
 *
 * Output is deterministic (no timestamps) so the drift check stays green.
 */

import { readFileSync, writeFileSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { PRERENDER_ROUTES, canonicalFor } from '../../apps/landing/src/route-head.ts'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, '..', '..')
const REGISTRY_PATH = join(ROOT, 'registry.json')
const DOCS_OUT_PATH = join(ROOT, 'apps', 'docs', 'public', 'sitemap.xml')
const LANDING_OUT_PATH = join(ROOT, 'apps', 'landing', 'public', 'sitemap.xml')

const DOCS_SITE_URL = 'https://docs.cascivo.com'

/** Indexable static docs routes, in priority order. Kept in sync with docs src/seo.ts. */
const DOCS_STATIC_ROUTES: { path: string; priority: string }[] = [
  { path: '/', priority: '1.0' },
  { path: '/why', priority: '0.8' },
  { path: '/ai', priority: '0.8' },
  { path: '/directory', priority: '0.8' },
  { path: '/context', priority: '0.8' },
  { path: '/charts', priority: '0.7' },
  { path: '/icons', priority: '0.7' },
  { path: '/layouts', priority: '0.7' },
  { path: '/benchmarks', priority: '0.7' },
  { path: '/parity', priority: '0.7' },
  { path: '/migrating', priority: '0.7' },
  { path: '/brand', priority: '0.6' },
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

// ── Docs sitemap ──────────────────────────────────────────────────────────────
const registry = JSON.parse(readFileSync(REGISTRY_PATH, 'utf8')) as { components: RegistryEntry[] }
const componentNames = registry.components.map((c) => c.name).sort((a, b) => a.localeCompare(b))

const docsEntries = [
  ...DOCS_STATIC_ROUTES.map((r) => urlEntry(`${DOCS_SITE_URL}${r.path}`, r.priority)),
  ...componentNames.map((name) => urlEntry(`${DOCS_SITE_URL}/components/${name}`, '0.6')),
]
writeFileSync(DOCS_OUT_PATH, sitemap(docsEntries))
console.log(`sitemap: wrote ${docsEntries.length} urls to ${DOCS_OUT_PATH}`)

// ── Landing sitemap ───────────────────────────────────────────────────────────
// Home first (priority 1.0), then every prerendered route; nested routes
// (e.g. examples/*) rank a notch below the top-level pages.
const landingRoutes = [
  { path: '/', priority: '1.0' },
  ...PRERENDER_ROUTES.map((route) => ({
    path: `/${route}`,
    priority: route.includes('/') ? '0.7' : '0.8',
  })),
]
const landingEntries = landingRoutes.map((r) => urlEntry(canonicalFor(r.path), r.priority))
writeFileSync(LANDING_OUT_PATH, sitemap(landingEntries))
console.log(`sitemap: wrote ${landingEntries.length} urls to ${LANDING_OUT_PATH}`)
