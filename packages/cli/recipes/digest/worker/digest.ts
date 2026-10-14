import { migrate, queryRows } from '@cascivo/app/db'
import type { Database } from '@cascivo/app/db'
import { exportPage } from '@cascivo/app/export'
import type { ExportBrowser } from '@cascivo/app/export'
import { parseDigestRun } from '../src/digest'
import type { DigestRun } from '../src/digest'

const migrations = [
  {
    id: '0001_digest_runs',
    statements: [
      `CREATE TABLE digest_runs (
        id TEXT PRIMARY KEY,
        started_at TEXT NOT NULL,
        status TEXT NOT NULL,
        detail TEXT NOT NULL,
        trigger TEXT NOT NULL
      )`,
    ],
  },
]

/** What sending the digest needs of the Email Service binding (`send_email`). */
export interface DigestSender {
  send(message: {
    from: string
    to: string[]
    subject: string
    text: string
    html: string
    attachments: {
      filename: string
      type: string
      content: Uint8Array
      disposition: 'attachment'
    }[]
  }): Promise<unknown>
}

export interface DigestEnv {
  DB: Database
  EMAIL: DigestSender
  /** Comma-separated recipients, set in wrangler.jsonc. */
  DIGEST_TO: string
  DIGEST_FROM: string
  /** The deployed app's origin, which the browser opens: a cron has no request to read it from. */
  APP_URL: string
}

/** Why the digest cannot be sent yet, or `null` when it can. */
function missing(env: DigestEnv, origin: string): string | null {
  const unset = [
    ...(env.DIGEST_TO.trim() ? [] : ['DIGEST_TO']),
    ...(env.DIGEST_FROM.trim() ? [] : ['DIGEST_FROM']),
    ...(origin ? [] : ['APP_URL']),
  ]
  return unset.length > 0 ? `Set ${unset.join(', ')} in wrangler.jsonc` : null
}

/**
 * Renders /report to a PDF with Browser Run and emails it to DIGEST_TO. Every run is recorded,
 * whatever happens, so the /digest page shows why a Monday's digest did not arrive.
 */
export async function runDigest(
  env: DigestEnv,
  launch: () => Promise<ExportBrowser>,
  trigger: DigestRun['trigger'],
  origin = env.APP_URL,
): Promise<DigestRun> {
  const run = { id: crypto.randomUUID(), startedAt: new Date().toISOString(), trigger }
  let result: DigestRun
  const skip = missing(env, origin)
  if (skip) {
    result = { ...run, status: 'skipped', detail: skip }
  } else {
    try {
      const pdf = await exportPage(launch, new URL('/report', origin).href, { format: 'pdf' })
      const to = env.DIGEST_TO.split(',')
        .map((address) => address.trim())
        .filter(Boolean)
      const week = run.startedAt.slice(0, 10)
      await env.EMAIL.send({
        from: env.DIGEST_FROM,
        to,
        subject: `Weekly report, ${week}`,
        text: 'This week’s report is attached as a PDF.',
        html: '<p>This week’s report is attached as a PDF.</p>',
        attachments: [
          {
            filename: `report-${week}.pdf`,
            type: 'application/pdf',
            content: pdf,
            disposition: 'attachment',
          },
        ],
      })
      result = {
        ...run,
        status: 'sent',
        detail: `${to.join(', ')} (${Math.round(pdf.byteLength / 1024)} KB)`,
      }
    } catch (error) {
      console.error('[digest] failed:', error)
      result = {
        ...run,
        status: 'failed',
        detail: error instanceof Error ? error.message : String(error),
      }
    }
  }
  await migrate(env.DB, migrations)
  await env.DB.prepare(
    'INSERT INTO digest_runs (id, started_at, status, detail, trigger) VALUES (?, ?, ?, ?, ?)',
  )
    .bind(result.id, result.startedAt, result.status, result.detail.slice(0, 500), result.trigger)
    .run()
  return result
}

export async function listRuns(db: Database): Promise<DigestRun[]> {
  await migrate(db, migrations)
  return queryRows(
    db,
    `SELECT id, started_at AS startedAt, status, detail, trigger FROM digest_runs
     ORDER BY started_at DESC LIMIT 20`,
    [],
    parseDigestRun,
  )
}
