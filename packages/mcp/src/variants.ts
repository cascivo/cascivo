import { existsSync, readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

export interface VariantToken {
  name: string
  layer: 'primitive' | 'semantic' | 'component'
  group: string
  role?: string
  slot?: string
  byTheme: Record<string, string | null>
}

export interface VariantMatrix {
  generatedAt: string
  themes: string[]
  families: Record<string, Record<string, string>>
  tokens: VariantToken[]
}

type FetchFn = (url: string, init?: RequestInit) => Promise<Response>

const HERE = dirname(fileURLToPath(import.meta.url))
const BASE_URL = 'https://cascivo.com'

export async function loadVariantMatrix(fetchFn?: FetchFn): Promise<VariantMatrix> {
  const localPaths = [
    join(HERE, '..', '..', '..', 'apps', 'site', 'public', 'tokens.variants.json'),
    join(HERE, 'tokens.variants.json'),
  ]
  for (const p of localPaths) {
    if (existsSync(p)) return JSON.parse(readFileSync(p, 'utf8')) as VariantMatrix
  }
  const url = `${BASE_URL}/tokens.variants.json`
  const fn = fetchFn ?? fetch
  const res = await fn(url)
  if (!res.ok) throw new Error(`Failed to fetch variant matrix: ${res.status}`)
  return res.json() as Promise<VariantMatrix>
}
