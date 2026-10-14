/**
 * /search, shared by the Worker (which searches) and the page (which asks). `semantic` is
 * Vectorize over Workers AI embeddings; `keyword` is the `vite dev` stand-in, SQLite's
 * full-text search, because neither runs locally.
 */
export interface SearchHit {
  id: string
  title: string
  body: string
  /** Higher is closer. Cosine similarity when semantic; a rank when keyword. */
  score: number
}

export interface SearchResult {
  mode: 'semantic' | 'keyword'
  hits: SearchHit[]
  /** Articles in the vector index, when semantic: 0 until "Index articles" has run. */
  indexed: number | null
}

export function parseSearchQuery(raw: unknown): { q: string } {
  if (typeof raw === 'object' && raw !== null) {
    const { q } = raw as Record<string, unknown>
    if (typeof q === 'string' && q.trim() !== '' && q.length <= 200) return { q: q.trim() }
  }
  throw new Error('Expected { q }: 1–200 characters')
}

function parseHit(raw: unknown): SearchHit {
  if (typeof raw === 'object' && raw !== null) {
    const { id, title, body, score } = raw as Record<string, unknown>
    if (
      typeof id === 'string' &&
      typeof title === 'string' &&
      typeof body === 'string' &&
      typeof score === 'number'
    ) {
      return { id, title, body, score }
    }
  }
  throw new Error('Malformed search hit')
}

export function parseSearchResult(raw: unknown): SearchResult {
  if (typeof raw === 'object' && raw !== null) {
    const { mode, hits, indexed } = raw as Record<string, unknown>
    if (
      (mode === 'semantic' || mode === 'keyword') &&
      Array.isArray(hits) &&
      (indexed === null || typeof indexed === 'number')
    ) {
      return { mode, hits: hits.map(parseHit), indexed }
    }
  }
  throw new Error('Malformed search result')
}

export function parseIndexed(raw: unknown): { indexed: number } {
  if (typeof raw === 'object' && raw !== null) {
    const { indexed } = raw as Record<string, unknown>
    if (typeof indexed === 'number') return { indexed }
  }
  throw new Error('Malformed reply')
}
