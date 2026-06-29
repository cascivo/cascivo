import { existsSync, readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

export interface TokenCatalogEntry {
  name: string
  value: string
  layer: 'primitive' | 'semantic' | 'component'
  group: string
  resolvedDefault: string | null
  resolvesPerTheme: boolean
  /** True unless this token is a backwards-compat alias of another (canonical) token. */
  canonical?: boolean
  /** When this token is an alias, the canonical token name to prefer instead. */
  aliasOf?: string
}

export interface TokenCatalog {
  generatedAt: string
  count: number
  tokens: TokenCatalogEntry[]
}

type FetchFn = (url: string, init?: RequestInit) => Promise<Response>

const HERE = dirname(fileURLToPath(import.meta.url))
const CATALOG_BASE_URL = 'https://cascivo.com'

export async function loadTokenCatalog(fetchFn?: FetchFn): Promise<TokenCatalog> {
  const localPaths = [
    join(HERE, '..', '..', '..', 'apps', 'site', 'public', 'tokens.catalog.json'),
    join(HERE, 'tokens.catalog.json'),
  ]
  for (const p of localPaths) {
    if (existsSync(p)) return JSON.parse(readFileSync(p, 'utf8')) as TokenCatalog
  }
  const url = `${CATALOG_BASE_URL}/tokens.catalog.json`
  const fn = fetchFn ?? fetch
  const res = await fn(url)
  if (!res.ok) throw new Error(`Failed to fetch token catalog: ${res.status}`)
  return res.json() as Promise<TokenCatalog>
}
