import { existsSync, readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { CASCIVO_HOST } from './host.js'

export interface IconCatalogEntry {
  /** kebab-case id, e.g. "git-branch". */
  name: string
  /** Export name from @cascivo/icons, e.g. "GitBranch". */
  pascalName: string
  category: string
  tags: string[]
  /** name tokens + synonyms + aliases + source keywords. */
  keywords: string[]
  /** Foreign/common names this icon answers to (Lucide/Radix/intent). */
  aliases?: string[]
  /** Inner geometry markup (no <svg> wrapper). */
  svg: string
}

export interface IconCatalog {
  generatedFrom: string
  count: number
  icons: IconCatalogEntry[]
}

type FetchFn = (url: string, init?: RequestInit) => Promise<Response>

const HERE = dirname(fileURLToPath(import.meta.url))

export async function loadIconCatalog(fetchFn?: FetchFn): Promise<IconCatalog> {
  const localPaths = [
    join(HERE, '..', '..', '..', 'apps', 'site', 'public', 'icons.catalog.json'),
    join(HERE, 'icons.catalog.json'),
  ]
  for (const p of localPaths) {
    if (existsSync(p)) return JSON.parse(readFileSync(p, 'utf8')) as IconCatalog
  }
  const url = `${CASCIVO_HOST}/icons.catalog.json`
  const fn = fetchFn ?? fetch
  const res = await fn(url)
  if (!res.ok) throw new Error(`Failed to fetch icon catalog: ${res.status}`)
  return res.json() as Promise<IconCatalog>
}

/**
 * Rank icons by a free-text query against name, pascalName, keywords, and
 * aliases — the same fields the docs gallery searches, so an agent that guesses
 * a Lucide/Radix name (`LayoutDashboard`, `Rocket`) or an intent word (`deploy`)
 * still resolves the correct cascivo export. Exact pascalName/name matches rank
 * first, then alias hits, then keyword substring hits.
 */
export function searchIcons(icons: IconCatalogEntry[], query: string): IconCatalogEntry[] {
  const q = query.trim().toLowerCase()
  if (q === '') return icons
  // Multi-word queries ("git branch") match when every word appears somewhere in
  // the icon's searchable text — single-token keywords never contain a space.
  const words = q.split(/\s+/).filter(Boolean)
  const scored: { icon: IconCatalogEntry; score: number }[] = []
  for (const icon of icons) {
    const pascal = icon.pascalName.toLowerCase()
    const aliases = (icon.aliases ?? []).map((a) => a.toLowerCase())
    const haystack = [pascal, icon.name, ...aliases, ...icon.keywords]
    let score = 0
    if (pascal === q || icon.name === q) score = 100
    else if (aliases.includes(q)) score = 90
    else if (pascal.includes(q) || icon.name.includes(q)) score = 70
    else if (aliases.some((a) => a.includes(q))) score = 50
    else if (icon.keywords.some((k) => k.includes(q))) score = 30
    else if (words.length > 1 && words.every((w) => haystack.some((h) => h.includes(w)))) score = 20
    if (score > 0) scored.push({ icon, score })
  }
  scored.sort((a, b) => b.score - a.score || a.icon.pascalName.localeCompare(b.icon.pascalName))
  return scored.map((s) => s.icon)
}
