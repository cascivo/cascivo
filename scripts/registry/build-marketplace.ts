/**
 * Build the static marketplace catalog (apps/site/public/marketplace.json).
 *
 * Backend-free: this runs in CI, fetches every directory-listed registry that
 * `provides` templates, filters `type:'template'` items, bakes GitHub star
 * counts at build time, and writes a flat, gallery-ready static JSON file. The
 * gallery (apps/site) renders that file — it never queries anything at runtime.
 *
 * Network failures are soft (a registry is skipped with a warning); the catalog
 * is written from whatever resolved. Run: pnpm exec tsx scripts/registry/build-marketplace.ts
 */
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { buildCatalog, type MarketplaceSource } from '../../packages/registry/src/marketplace.ts'
import type { RegistryItem } from '../../packages/registry/src/types.ts'

const HERE = dirname(fileURLToPath(import.meta.url))
const REPO_ROOT = join(HERE, '..', '..')
const DIRECTORY_PATH = join(REPO_ROOT, 'directory', 'registries.json')
const OUT_PATH = join(REPO_ROOT, 'apps', 'site', 'public', 'marketplace.json')
/** The in-repo first-party templates index — seeds the catalog without a deploy. */
const FIRST_PARTY_TEMPLATES = join(REPO_ROOT, 'templates', 'cascivo-registry.json')
const FIRST_PARTY_HOMEPAGE = 'https://github.com/cascivo/cascivo'

interface DirEntry {
  namespace: string
  homepage: string
  registryUrl: string
  verified: boolean
  provides?: string[]
}

/** Derive the index URL from a registryUrl template. */
function indexUrl(registryUrl: string): string {
  if (registryUrl.endsWith('/{name}.json'))
    return registryUrl.replace('/{name}.json', '/registry.json')
  return registryUrl.replace('{name}', 'registry')
}

/** Parse owner/repo from a github.com homepage URL, or null. */
function parseRepo(homepage: string): { owner: string; repo: string } | null {
  const m = /github\.com\/([^/]+)\/([^/?#]+)/.exec(homepage)
  if (!m) return null
  return { owner: m[1]!, repo: m[2]!.replace(/\.git$/, '') }
}

async function fetchJson(url: string): Promise<unknown> {
  const res = await fetch(url, { headers: { Accept: 'application/json' } })
  if (!res.ok) throw new Error(`HTTP ${res.status} ${res.statusText}`)
  return res.json() as Promise<unknown>
}

/** Best-effort GitHub star count; returns undefined on any failure. */
async function fetchStars(homepage: string): Promise<number | undefined> {
  const repo = parseRepo(homepage)
  if (!repo) return undefined
  const headers: Record<string, string> = { Accept: 'application/vnd.github+json' }
  const token = process.env['GITHUB_TOKEN']
  if (token) headers['Authorization'] = `Bearer ${token}`
  try {
    const res = await fetch(`https://api.github.com/repos/${repo.owner}/${repo.repo}`, { headers })
    if (!res.ok) return undefined
    const body = (await res.json()) as { stargazers_count?: number }
    return typeof body.stargazers_count === 'number' ? body.stargazers_count : undefined
  } catch {
    return undefined
  }
}

const raw = JSON.parse(await readFile(DIRECTORY_PATH, 'utf8')) as { registries: DirEntry[] }
const sources: MarketplaceSource[] = []
const warnings: string[] = []

// First-party templates ship in this repo — read them locally so the catalog is
// seeded deterministically (and offline), independent of any deploy.
try {
  const local = JSON.parse(await readFile(FIRST_PARTY_TEMPLATES, 'utf8')) as {
    items?: RegistryItem[]
  }
  if (local.items?.length) {
    console.log(`Including ${local.items.length} first-party templates from templates/`)
    sources.push({
      entry: { namespace: '@cascivo', verified: true, homepage: FIRST_PARTY_HOMEPAGE },
      items: local.items,
    })
  }
} catch (err) {
  warnings.push(`[@cascivo] could not read first-party templates: ${(err as Error).message}`)
}

for (const entry of raw.registries) {
  if (!entry.provides?.includes('template')) continue
  const url = indexUrl(entry.registryUrl)
  console.log(`Fetching templates from ${entry.namespace} → ${url}`)
  let index: { items?: RegistryItem[] }
  try {
    index = (await fetchJson(url)) as { items?: RegistryItem[] }
  } catch (err) {
    warnings.push(`[${entry.namespace}] fetch failed (${url}): ${(err as Error).message}`)
    continue
  }
  const stars = await fetchStars(entry.homepage)
  sources.push({
    entry: {
      namespace: entry.namespace,
      verified: entry.verified,
      homepage: entry.homepage,
      ...(typeof stars === 'number' ? { stars } : {}),
    },
    items: index.items ?? [],
  })
}

const generatedAt = process.env['MARKETPLACE_DATE'] ?? new Date().toISOString().slice(0, 10)
const catalog = buildCatalog(sources, generatedAt)

await mkdir(dirname(OUT_PATH), { recursive: true })
await writeFile(OUT_PATH, `${JSON.stringify(catalog, null, 2)}\n`, 'utf8')

if (warnings.length > 0) {
  console.warn('\nWarnings:')
  for (const w of warnings) console.warn(`  WARN: ${w}`)
}
console.log(`\nWrote ${catalog.templates.length} templates to ${OUT_PATH}`)
