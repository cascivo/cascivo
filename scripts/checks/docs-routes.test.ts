/**
 * Docs route-indexing guard.
 *
 * Every static docs route (DOCS_ROUTES in apps/site/src/DocsApp.tsx) must have
 * both an SEO head entry (ROUTE_HEAD in apps/site/src/seo.ts) and a sitemap
 * entry (DOCS_STATIC_ROUTES in scripts/sitemap/generate.ts). Without either, a
 * route silently renders as `noindex` "Not found — cascivo docs" and never
 * reaches crawlers — the bug behind the dashboard feedback's "installation
 * page 404'd" (the content existed at /docs/getting-started, but that route
 * was itself unindexed and undiscoverable by search).
 *
 * Run with: `pnpm docs-routes:check` (also runs in `regen`/CI).
 */
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, it } from 'node:test'

const REPO_ROOT = join(import.meta.dirname, '../..')
const DOCS_APP_PATH = join(REPO_ROOT, 'apps/site/src/DocsApp.tsx')
const SEO_PATH = join(REPO_ROOT, 'apps/site/src/seo.ts')
const SITEMAP_PATH = join(REPO_ROOT, 'scripts/sitemap/generate.ts')

/** Extracts a top-level `const NAME ... = { ... }` or `= [ ... ]` block by name (closing brace/bracket at column 0). */
function extractBlock(source: string, constName: string, open: '{' | '['): string {
  const close = open === '{' ? '}' : ']'
  const startRe = new RegExp(`const ${constName}\\b[^=]*=\\s*\\${open}`)
  const m = startRe.exec(source)
  if (!m) throw new Error(`Could not find "const ${constName} = ${open}" in source`)
  const bodyStart = m.index + m[0].length
  const endRe = new RegExp(`\\n${'\\' + close}`)
  const endMatch = endRe.exec(source.slice(bodyStart))
  if (!endMatch) throw new Error(`Could not find closing "${close}" for ${constName}`)
  return source.slice(bodyStart, bodyStart + endMatch.index)
}

/** Static (non-dynamic) `/docs/...` route paths declared as DOCS_ROUTES keys. */
function extractDocsRoutes(): string[] {
  const source = readFileSync(DOCS_APP_PATH, 'utf8')
  const body = extractBlock(source, 'DOCS_ROUTES', '{')
  const paths: string[] = []
  const keyRe = /'(\/docs[^']*)':\s*\w+,/g
  let m: RegExpExecArray | null
  while ((m = keyRe.exec(body)) !== null) paths.push(m[1]!)
  return paths
}

/** Keys of ROUTE_HEAD in seo.ts (docs-relative paths, e.g. '/', '/ai'). */
function extractRouteHeadKeys(): Set<string> {
  const source = readFileSync(SEO_PATH, 'utf8')
  const body = extractBlock(source, 'ROUTE_HEAD', '{')
  const keys = new Set<string>()
  const keyRe = /^\s*'([^']*)':\s*\{/gm
  let m: RegExpExecArray | null
  while ((m = keyRe.exec(body)) !== null) keys.add(m[1]!)
  return keys
}

/** `path:` values inside the DOCS_STATIC_ROUTES array in the sitemap generator. */
function extractSitemapPaths(): Set<string> {
  const source = readFileSync(SITEMAP_PATH, 'utf8')
  const body = extractBlock(source, 'DOCS_STATIC_ROUTES', '[')
  const paths = new Set<string>()
  const pathRe = /path:\s*'([^']*)'/g
  let m: RegExpExecArray | null
  while ((m = pathRe.exec(body)) !== null) paths.add(m[1]!)
  return paths
}

describe('docs-routes:check — every static docs route is indexable', () => {
  const docsRoutes = extractDocsRoutes()

  it('parser sanity check (finds the known routes)', () => {
    assert.ok(docsRoutes.includes('/docs/installation'))
    assert.ok(docsRoutes.includes('/docs/getting-started'))
  })

  it('every route has an SEO head entry (apps/site/src/seo.ts ROUTE_HEAD)', () => {
    const routeHeadKeys = extractRouteHeadKeys()
    const missing = docsRoutes
      .map((path) => (path === '/docs' ? '/' : path.replace(/^\/docs/, '')))
      .filter((rel) => !routeHeadKeys.has(rel))

    if (missing.length > 0) {
      assert.fail(
        `${missing.length} docs route(s) missing from seo.ts ROUTE_HEAD (served as noindex ` +
          `"Not found"):\n${missing.map((m) => `  ${m}`).join('\n')}`,
      )
    }
  })

  it('every route has a sitemap entry (scripts/sitemap/generate.ts DOCS_STATIC_ROUTES)', () => {
    const sitemapPaths = extractSitemapPaths()
    const missing = docsRoutes.filter((path) => !sitemapPaths.has(path))

    if (missing.length > 0) {
      assert.fail(
        `${missing.length} docs route(s) missing from the sitemap generator (invisible to ` +
          `crawlers):\n${missing.map((m) => `  ${m}`).join('\n')}`,
      )
    }
  })
})
