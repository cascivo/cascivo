import { existsSync, readFileSync, readdirSync } from 'node:fs'
import { createRequire } from 'node:module'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { CASCIVO_HOST } from './host.js'

/**
 * Concept-guide loader for the MCP server. Guides (getting-started, theming,
 * tokens, troubleshooting, …) were previously reachable only over the web; this
 * makes them a first-class MCP surface, sourced with no network where possible.
 *
 * Resolution order (offline-first): the monorepo `apps/site/public/docs` (dev) →
 * the `@cascivo/docs` package's bundled guides (the offline docs channel, WS-L) →
 * the copy in this server's own `dist/guides` (postbuild) → a network fetch of
 * `cascivo.com/docs/<slug>.md` as the last resort.
 */
const HERE = dirname(fileURLToPath(import.meta.url))
const require = createRequire(import.meta.url)

type FetchFn = (url: string, init?: RequestInit) => Promise<Response>

function guidesDir(): string | null {
  const candidates: string[] = [
    join(HERE, '..', '..', '..', 'apps', 'site', 'public', 'docs'),
    join(HERE, 'guides'),
  ]
  try {
    const pkgJson = require.resolve('@cascivo/docs/package.json')
    candidates.push(join(dirname(pkgJson), 'content', 'guides'))
  } catch {
    // @cascivo/docs not installed — fall through to the other candidates / fetch.
  }
  for (const c of candidates) {
    if (existsSync(c)) return c
  }
  return null
}

/** Slugs of every available guide (empty if no local source is present). */
export function listGuides(): string[] {
  const dir = guidesDir()
  if (!dir) return []
  return readdirSync(dir)
    .filter((f) => f.endsWith('.md') && f !== 'components.md')
    .map((f) => f.replace(/\.md$/, ''))
    .sort()
}

/** Load one guide's markdown by slug, or null if it can't be found. */
export async function loadGuide(slug: string, fetchFn?: FetchFn): Promise<string | null> {
  const s = slug.toLowerCase().replace(/\.md$/, '')
  const dir = guidesDir()
  if (dir) {
    const p = join(dir, `${s}.md`)
    if (existsSync(p)) return readFileSync(p, 'utf8')
  }
  const fn = fetchFn ?? fetch
  try {
    const res = await fn(`${CASCIVO_HOST}/docs/${s}.md`)
    if (!res.ok) return null
    return res.text()
  } catch {
    return null
  }
}
