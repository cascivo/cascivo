import { migrate, queryRows } from '@cascivo/app/db'
import type { Database } from '@cascivo/app/db'
import { exportPage } from '@cascivo/app/export'
import type { ExportBrowser } from '@cascivo/app/export'
import { getPage } from './pages'

const migrations = [
  {
    id: '0001_page_previews',
    statements: ['CREATE TABLE page_previews (slug TEXT PRIMARY KEY, png BLOB NOT NULL)'],
  },
]

/** A stored BLOB as bytes: D1 returns one as an array of numbers. */
function bytesOf(raw: unknown): Uint8Array | null {
  const png =
    typeof raw === 'object' && raw !== null ? (raw as Record<string, unknown>)['png'] : null
  if (png instanceof ArrayBuffer) return new Uint8Array(png)
  if (ArrayBuffer.isView(png)) return new Uint8Array(png.buffer, png.byteOffset, png.byteLength)
  if (Array.isArray(png) && png.every((b) => typeof b === 'number')) return Uint8Array.from(png)
  return null
}

/**
 * A published page's link-preview image, 1200 × 630: rendered from the page by Browser Run on
 * its first request and kept in D1, so a page shared a thousand times starts one browser.
 */
export async function pagePreview(
  db: Database,
  slug: string,
  origin: string,
  launch: () => Promise<ExportBrowser>,
): Promise<Response> {
  await getPage(db, slug) // 404 for a page that does not exist
  await migrate(db, migrations)
  const [stored] = await queryRows(
    db,
    'SELECT png FROM page_previews WHERE slug = ?',
    [slug],
    bytesOf,
  )
  let png = stored ?? null
  if (!png) {
    png = await exportPage(launch, new URL(`/p/${slug}`, origin).href, {
      format: 'png',
      viewport: { width: 1200, height: 630 },
      fullPage: false,
    })
    await db
      .prepare('INSERT OR REPLACE INTO page_previews (slug, png) VALUES (?, ?)')
      .bind(slug, png)
      .run()
  }
  return new Response(new Uint8Array(png), {
    headers: { 'content-type': 'image/png', 'cache-control': 'public, max-age=86400' },
  })
}
