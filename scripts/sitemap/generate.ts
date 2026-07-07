#!/usr/bin/env node
/**
 * Generates the single sitemap.xml for the unified site (cascivo.com):
 *   - marketing routes   from apps/site/src/marketing/route-head.ts (PRERENDER_ROUTES)
 *   - docs static routes  (under /docs), kept in sync with apps/site/src/seo.ts
 *   - docs component pages from registry.json (under /docs/components/<name>)
 *
 * Both surfaces now live in one app at one domain, so there is one sitemap.
 * Output is deterministic (derived from git history, not wall-clock) so the
 * drift check stays green; run as part of `pnpm regen`.
 */

import { execFileSync } from 'node:child_process'
import { readFileSync, writeFileSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { POSTS } from '../../apps/site/src/blog/index.ts'
import { CATEGORY_ORDER } from '../../apps/site/src/category-head.ts'
import {
  PRERENDER_ROUTES,
  canonicalFor,
  SITE_URL,
} from '../../apps/site/src/marketing/route-head.ts'
import { THEME_ORDER } from '../../apps/site/src/theme-head.ts'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, '..', '..')
const REGISTRY_PATH = join(ROOT, 'registry.json')
const OUT_PATH = join(ROOT, 'apps', 'site', 'public', 'sitemap.xml')
const RAW_BASE = 'https://raw.githubusercontent.com/cascivo/cascivo/main/'

/**
 * Last-modified date for a repo-relative path, from git history (`%cs` = commit
 * date, short form). Deterministic across runs given the same history — no
 * wall-clock — so the drift check (`pnpm regen` + `git diff --exit-code`) stays
 * green until the source file actually changes. Returns undefined for paths git
 * has no history for (e.g. not yet committed).
 */
function lastModForPath(relPath: string): string | undefined {
  try {
    const out = execFileSync('git', ['log', '-1', '--format=%cs', '--', relPath], {
      cwd: ROOT,
      encoding: 'utf8',
    }).trim()
    return out || undefined
  } catch {
    return undefined
  }
}

/** Most recent lastmod across a set of repo-relative paths. */
function latestLastMod(relPaths: string[]): string | undefined {
  return relPaths
    .map(lastModForPath)
    .filter((d): d is string => Boolean(d))
    .sort()
    .at(-1)
}

/** Indexable static docs routes (under /docs), in priority order. */
const DOCS_STATIC_ROUTES: { path: string; priority: string }[] = [
  { path: '/docs', priority: '0.9' },
  { path: '/docs/why', priority: '0.8' },
  { path: '/docs/faq', priority: '0.7' },
  { path: '/docs/platform', priority: '0.7' },
  { path: '/docs/upgrading', priority: '0.7' },
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
  type?: string
  category: string
  files?: string[]
}

function urlEntry(loc: string, priority: string, lastmod?: string): string {
  const lastmodTag = lastmod ? `\n    <lastmod>${lastmod}</lastmod>` : ''
  return `  <url>\n    <loc>${loc}</loc>${lastmodTag}\n    <priority>${priority}</priority>\n  </url>`
}

function sitemap(entries: string[]): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${entries.join('\n')}
</urlset>
`
}

const registry = JSON.parse(readFileSync(REGISTRY_PATH, 'utf8')) as { components: RegistryEntry[] }
const components = [...registry.components].sort((a, b) => a.name.localeCompare(b.name))

// Home first (1.0), then marketing routes, then docs static routes + components.
const marketingRoutes = [
  { path: '/', priority: '1.0' },
  ...PRERENDER_ROUTES.map((route) => ({
    path: `/${route}`,
    priority: route.includes('/') ? '0.7' : '0.8',
  })),
]

// Coarse but deterministic: every marketing route's head/copy is sourced from
// route-head.ts, and every static docs route's head from seo.ts, so a change to
// either bumps every route it governs. Component pages get per-component
// lastmod below, from their own source files — much more precise.
const marketingLastMod = lastModForPath('apps/site/src/marketing/route-head.ts')
const docsStaticLastMod = lastModForPath('apps/site/src/seo.ts')
// Fallback for registry entries with no `files` (some chart/editor/flow entries
// have an empty files array) — registry.json's own commit still moves whenever
// any manifest changes, so it's a safe, deterministic last resort.
const registryLastMod = lastModForPath('registry.json')

const categoryRoutes = CATEGORY_ORDER.filter((cat) =>
  registry.components.some((c) => c.category === cat),
)

const entries = [
  ...marketingRoutes.map((r) => urlEntry(canonicalFor(r.path), r.priority, marketingLastMod)),
  ...DOCS_STATIC_ROUTES.map((r) => urlEntry(`${SITE_URL}${r.path}`, r.priority, docsStaticLastMod)),
  ...categoryRoutes.map((cat) =>
    urlEntry(`${SITE_URL}/docs/categories/${cat}`, '0.7', registryLastMod),
  ),
  ...components.map((c) => {
    const relPaths = (c.files ?? [])
      .filter((f) => f.startsWith(RAW_BASE))
      .map((f) => f.slice(RAW_BASE.length))
    return urlEntry(
      `${SITE_URL}/docs/components/${c.name}`,
      '0.6',
      latestLastMod(relPaths) ?? registryLastMod,
    )
  }),
  // Accessibility guides — one per `type: 'component'` entry (real UI
  // controls only; charts/layouts/blocks don't get one, see vite.config.ts).
  ...components
    .filter((c) => (c.type ?? 'component') === 'component')
    .map((c) => {
      const relPaths = (c.files ?? [])
        .filter((f) => f.startsWith(RAW_BASE))
        .map((f) => f.slice(RAW_BASE.length))
      return urlEntry(
        `${SITE_URL}/accessibility/${c.name}`,
        '0.6',
        latestLastMod(relPaths) ?? registryLastMod,
      )
    }),
  ...THEME_ORDER.map((theme) =>
    urlEntry(
      `${SITE_URL}/docs/themes/${theme}`,
      '0.6',
      lastModForPath(`packages/themes/src/${theme}.css`),
    ),
  ),
  // /blog isn't in PRERENDER_ROUTES (see vite.config.ts — it gets a real
  // post-list body instead of the generic thin one), so it's not covered by
  // marketingRoutes above; add it and every post explicitly. lastmod comes
  // from each post's own authored date, not git history.
  urlEntry(`${SITE_URL}/blog`, '0.8', POSTS[0]?.dateModified ?? POSTS[0]?.datePublished),
  ...POSTS.map((post) =>
    urlEntry(`${SITE_URL}/blog/${post.slug}`, '0.6', post.dateModified ?? post.datePublished),
  ),
]

writeFileSync(OUT_PATH, sitemap(entries))
console.log(`sitemap: wrote ${entries.length} urls to ${OUT_PATH}`)
