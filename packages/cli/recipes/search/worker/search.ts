import { HttpError } from '@cascivo/app/api'
import { migrate, queryRows } from '@cascivo/app/db'
import type { Database } from '@cascivo/app/db'
import type { SearchHit, SearchResult } from '../src/search'
import { articles } from './articles'

/** A Workers AI embedding model; its dimensions (768) are the Vectorize index's. */
const EMBEDDING_MODEL = '@cf/baai/bge-base-en-v1.5'

// `vite dev` has neither Workers AI nor Vectorize, so it searches with SQLite's full-text
// index instead: by words, not meaning. `VITE_REAL_AI=1 vite dev` uses the real ones.
const keywordOnly = import.meta.env.DEV && import.meta.env['VITE_REAL_AI'] !== '1'

/** What search needs of the Vectorize binding. */
export interface VectorIndex {
  query(
    vector: number[],
    options: { topK: number },
  ): Promise<{ matches: { id: string; score: number }[] }>
  upsert(vectors: { id: string; values: number[] }[]): Promise<unknown>
  describe(): Promise<{ vectorCount: number }>
}

/** What search needs of the Workers AI binding. */
export interface Embedder {
  run(model: typeof EMBEDDING_MODEL, input: { text: string[] }): Promise<unknown>
}

export interface SearchEnv {
  DB: Database
  AI: Embedder
  ARTICLES_INDEX: VectorIndex
}

const migrations = [
  {
    id: '0001_articles',
    statements: [
      'CREATE TABLE articles (id TEXT PRIMARY KEY, title TEXT NOT NULL, body TEXT NOT NULL)',
      "CREATE VIRTUAL TABLE articles_fts USING fts5(title, body, content='articles', content_rowid='rowid')",
    ],
  },
]

/** The schema, then the articles (once: a second isolate's inserts are ignored). */
async function ready(db: Database): Promise<void> {
  await migrate(db, migrations)
  const [seeded] = await queryRows(db, 'SELECT COUNT(*) AS n FROM articles', [], (row) =>
    typeof row === 'object' && row !== null ? Number((row as Record<string, unknown>)['n']) : 0,
  )
  if (seeded) return
  await db.batch([
    ...articles.map((a) =>
      db
        .prepare('INSERT OR IGNORE INTO articles (id, title, body) VALUES (?, ?, ?)')
        .bind(a.id, a.title, a.body),
    ),
    // The full-text index reads the articles table; rebuild it from what is there now.
    db.prepare("INSERT INTO articles_fts (articles_fts) VALUES ('rebuild')"),
  ])
}

function parseRow(raw: unknown): SearchHit {
  if (typeof raw === 'object' && raw !== null) {
    const { id, title, body, score } = raw as Record<string, unknown>
    if (typeof id === 'string' && typeof title === 'string' && typeof body === 'string') {
      return { id, title, body, score: typeof score === 'number' ? score : 0 }
    }
  }
  throw new Error('Malformed article row')
}

/** Embeddings from Workers AI, checked: a model's reply is data like any other. */
async function embed(ai: Embedder, texts: string[]): Promise<number[][]> {
  const reply = await ai.run(EMBEDDING_MODEL, { text: texts })
  const data =
    typeof reply === 'object' && reply !== null ? (reply as Record<string, unknown>)['data'] : null
  if (
    !Array.isArray(data) ||
    data.length !== texts.length ||
    !data.every((v) => Array.isArray(v) && v.every((n) => typeof n === 'number'))
  ) {
    throw new Error('Workers AI returned no embeddings')
  }
  return data as number[][]
}

/** Every word as a quoted FTS5 term, OR-ed: user input never reaches FTS5's query syntax. */
function keywordQuery(q: string): string | null {
  const words = q.toLowerCase().match(/[\p{L}\p{N}]+/gu) ?? []
  return words.length > 0 ? words.map((w) => `"${w}"`).join(' OR ') : null
}

export async function search(env: SearchEnv, q: string): Promise<SearchResult> {
  await ready(env.DB)
  if (keywordOnly) {
    const match = keywordQuery(q)
    const hits = match
      ? await queryRows(
          env.DB,
          `SELECT a.id, a.title, a.body, -bm25(articles_fts) AS score
           FROM articles_fts JOIN articles a ON a.rowid = articles_fts.rowid
           WHERE articles_fts MATCH ? ORDER BY score DESC LIMIT 5`,
          [match],
          parseRow,
        )
      : []
    return { mode: 'keyword', hits, indexed: null }
  }
  const { vectorCount } = await env.ARTICLES_INDEX.describe()
  const [vector] = await embed(env.AI, [q])
  const { matches } = await env.ARTICLES_INDEX.query(vector!, { topK: 5 })
  if (matches.length === 0) return { mode: 'semantic', hits: [], indexed: vectorCount }
  const rows = await queryRows(
    env.DB,
    `SELECT id, title, body FROM articles WHERE id IN (${matches.map(() => '?').join(', ')})`,
    matches.map((m) => m.id),
    parseRow,
  )
  const byId = new Map(rows.map((row) => [row.id, row]))
  const hits = matches.flatMap((m) => {
    const row = byId.get(m.id)
    return row ? [{ ...row, score: m.score }] : []
  })
  return { mode: 'semantic', hits, indexed: vectorCount }
}

/**
 * Embeds every article and upserts it into the Vectorize index. Vectorize applies writes a few
 * seconds later, so `indexed` counts what it had already applied when this finished.
 */
export async function indexArticles(env: SearchEnv): Promise<{ indexed: number }> {
  if (keywordOnly)
    throw new HttpError(400, 'vite dev searches by keyword: there is nothing to index')
  await ready(env.DB)
  const rows = await queryRows(env.DB, 'SELECT id, title, body FROM articles', [], parseRow)
  for (let i = 0; i < rows.length; i += 50) {
    const batch = rows.slice(i, i + 50)
    const vectors = await embed(
      env.AI,
      batch.map((row) => `${row.title}\n${row.body}`),
    )
    await env.ARTICLES_INDEX.upsert(batch.map((row, j) => ({ id: row.id, values: vectors[j]! })))
  }
  return { indexed: (await env.ARTICLES_INDEX.describe()).vectorCount }
}
