import { HttpError } from '@cascivo/app/api'
import { migrate, queryRows } from '@cascivo/app/db'
import type { Database } from '@cascivo/app/db'
import { isSlug, parsePage } from '../src/pages'
import type { Page, PageInput, PageSummary } from '../src/pages'

const migrations = [
  {
    id: '0001_pages',
    statements: [
      `CREATE TABLE pages (
        slug TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        view TEXT NOT NULL,
        created_at TEXT NOT NULL
      )`,
    ],
  },
]

const ready = async (db: Database) => {
  await migrate(db, migrations)
  return db
}

/** Ten random base-36 characters: not guessable, so an unlisted page stays unlisted. */
function newSlug(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(10))
  return Array.from(bytes, (b) => (b % 36).toString(36)).join('')
}

/**
 * A stored row back into a page. The view is JSON text written by this Worker, but it is
 * parsed and validated again like anything read from storage: an older version of the app,
 * or a hand in the D1 console, may have written it.
 */
function pageFromRow(raw: unknown): Page {
  if (typeof raw !== 'object' || raw === null) throw new Error('Malformed page row')
  const row = raw as Record<string, unknown>
  if (typeof row['view'] !== 'string') throw new Error('Malformed page row')
  return parsePage({ ...row, view: JSON.parse(row['view']) })
}

export async function publishPage(db: Database, page: PageInput): Promise<PageSummary> {
  const summary = { slug: newSlug(), title: page.title, createdAt: new Date().toISOString() }
  await (
    await ready(db)
  )
    .prepare('INSERT INTO pages (slug, title, view, created_at) VALUES (?, ?, ?, ?)')
    .bind(summary.slug, summary.title, JSON.stringify(page.view), summary.createdAt)
    .run()
  return summary
}

export async function getPage(db: Database, slug: string): Promise<Page> {
  if (!isSlug(slug)) throw new HttpError(404, 'No such page')
  const [page] = await queryRows(
    await ready(db),
    'SELECT slug, title, view, created_at AS createdAt FROM pages WHERE slug = ?',
    [slug],
    pageFromRow,
  )
  if (!page) throw new HttpError(404, 'No such page')
  return page
}
