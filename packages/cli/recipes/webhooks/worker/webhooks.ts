import { migrate, queryRows } from '@cascivo/app/db'
import type { Database } from '@cascivo/app/db'
import { verifyWebhook } from '@cascivo/app/guard'
import { writeRoom } from '@cascivo/app/sync-server'
import type { RoomNamespace } from '@cascivo/app/sync-server'
import { DELIVERIES_ROOM, parseDelivery } from '../src/webhooks'
import type { Delivery } from '../src/webhooks'

const migrations = [
  {
    id: '0001_webhook_deliveries',
    statements: [
      `CREATE TABLE webhook_deliveries (
        id TEXT PRIMARY KEY,
        event TEXT NOT NULL,
        summary TEXT NOT NULL,
        received_at TEXT NOT NULL
      )`,
    ],
  },
]

/** Where GitHub posts; set it as the Payload URL of the repository's webhook. */
export const GITHUB_WEBHOOK_PATH = '/api/webhooks/github'

/** A field of an object, or `undefined` for anything else. */
const field = (value: unknown, key: string): unknown =>
  typeof value === 'object' && value !== null ? (value as Record<string, unknown>)[key] : undefined

/**
 * One line about a GitHub event. The payload is the sender's JSON, read field by field: a
 * signature proves who sent it, not what shape it has.
 */
function summarize(event: string, payload: unknown): string {
  const repo = field(field(payload, 'repository'), 'full_name')
  const action = field(payload, 'action')
  const where = typeof repo === 'string' ? repo : 'a repository'
  return `${event}${typeof action === 'string' ? ` ${action}` : ''} in ${where}`.slice(0, 200)
}

/**
 * Verifies a GitHub delivery, stores it once (a retry has the same X-GitHub-Delivery id and is
 * ignored), and pushes it to the /webhooks page. Answers 202 quickly, as GitHub expects.
 */
export async function receiveGithub(
  request: Request,
  env: { DB: Database; ROOMS: RoomNamespace<unknown>; WEBHOOK_SECRET: string },
): Promise<Response> {
  const { body, id } = await verifyWebhook(request, {
    scheme: 'github',
    secret: env.WEBHOOK_SECRET,
  })
  const event = request.headers.get('x-github-event') ?? 'unknown'
  let payload: unknown
  try {
    payload = JSON.parse(body)
  } catch {
    return Response.json({ error: 'Expected a JSON payload' }, { status: 400 })
  }
  const delivery: Delivery = {
    id: id ?? crypto.randomUUID(),
    event: event.slice(0, 60),
    summary: summarize(event, payload),
    receivedAt: new Date().toISOString(),
  }
  await migrate(env.DB, migrations)
  const stored = await queryRows(
    env.DB,
    `INSERT INTO webhook_deliveries (id, event, summary, received_at) VALUES (?, ?, ?, ?)
     ON CONFLICT (id) DO NOTHING RETURNING id`,
    [delivery.id, delivery.event, delivery.summary, delivery.receivedAt],
    (row) => row,
  )
  // Only a first delivery reaches the page; a retry was stored already.
  if (stored.length > 0) await writeRoom(env.ROOMS, DELIVERIES_ROOM, 'latest', { ...delivery })
  return Response.json({ received: true }, { status: 202 })
}

export async function listDeliveries(db: Database): Promise<Delivery[]> {
  await migrate(db, migrations)
  return queryRows(
    db,
    `SELECT id, event, summary, received_at AS receivedAt FROM webhook_deliveries
     ORDER BY received_at DESC LIMIT 50`,
    [],
    parseDelivery,
  )
}

/** A signed test delivery, run through the same path GitHub's would take. */
export async function sendTestDelivery(
  origin: string,
  env: { DB: Database; ROOMS: RoomNamespace<unknown>; WEBHOOK_SECRET: string },
): Promise<{ status: number }> {
  const body = JSON.stringify({ zen: 'Keep it logically awesome.', hook_id: 1 })
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(env.WEBHOOK_SECRET),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  )
  const mac = new Uint8Array(await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(body)))
  const hex = Array.from(mac, (b) => b.toString(16).padStart(2, '0')).join('')
  const response = await receiveGithub(
    new Request(new URL(GITHUB_WEBHOOK_PATH, origin), {
      method: 'POST',
      headers: {
        'x-github-event': 'ping',
        'x-github-delivery': crypto.randomUUID(),
        'x-hub-signature-256': `sha256=${hex}`,
      },
      body,
    }),
    env,
  )
  return { status: response.status }
}
