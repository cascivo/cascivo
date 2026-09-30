import type { Live, LiveEvent } from './live'
import { SyncRoom } from './sync-server'
import type { RoomNamespace } from './sync-server'
import type { Json } from './sync-protocol'

/**
 * `@cascivo/app/live-server` — the Durable Object behind a live dashboard, and the call a
 * Queue consumer makes to fill it.
 *
 * ```ts
 * export { LiveRoom } from '@cascivo/app/live-server'
 *
 * export default {
 *   // the browser watches: roomResponse(request, env.LIVE, 'ops', { readOnly: true })
 *   async queue(batch: LiveBatch, env: Env) {
 *     await recordLive(ops, env.LIVE, 'ops', batch.messages.map((m) => m.body))
 *   },
 * }
 * ```
 */

/** Set only by `recordLive`; `roomResponse` strips every `x-cascivo-room-*` header a caller sends. */
const RECORD_HEADER = 'x-cascivo-room-live-record'

/** The slice of a Queue producer binding a live dashboard sends events with. */
export interface LiveQueue {
  sendBatch(messages: Iterable<{ body: unknown }>): Promise<void>
}

/** The slice of a Queue consumer's batch `recordLive` reads. */
export interface LiveBatch {
  readonly messages: readonly { readonly body: unknown }[]
}

interface RecordRequest {
  window: number
  bucket: number
  events: { at: number; values: Record<string, number> }[]
}

function parseRecordRequest(raw: unknown): RecordRequest {
  if (typeof raw !== 'object' || raw === null) throw new Error('Expected an object')
  const { window, bucket, events } = raw as Record<string, unknown>
  if (typeof window !== 'number' || typeof bucket !== 'number' || !Array.isArray(events)) {
    throw new Error('Expected { window, bucket, events }')
  }
  if (!(bucket >= 1) || !(window >= bucket) || window > 3600) throw new Error('Bad window')
  const parsed = events.map((event: unknown) => {
    if (typeof event !== 'object' || event === null) throw new Error('Bad event')
    const { at, values } = event as Record<string, unknown>
    if (typeof at !== 'number' || !Number.isFinite(at)) throw new Error('Bad event time')
    if (typeof values !== 'object' || values === null) throw new Error('Bad event values')
    const out: Record<string, number> = {}
    for (const [key, value] of Object.entries(values)) {
      if (typeof value === 'number' && Number.isFinite(value)) out[key] = value
    }
    return { at, values: out }
  })
  return { window, bucket, events: parsed }
}

/**
 * A `SyncRoom` that adds events into per-bucket totals at `b/<seconds>` and drops buckets
 * older than the window. Browsers watch it read-only; only `recordLive` writes.
 */
export class LiveRoom extends SyncRoom {
  /** Records run one at a time, so two batches adding to one bucket cannot lose a count. */
  private recording: Promise<unknown> = Promise.resolve()

  override async fetch(request: Request): Promise<Response> {
    if (request.method === 'POST' && request.headers.get(RECORD_HEADER) === '1') {
      let body: RecordRequest
      try {
        body = parseRecordRequest(await request.json())
      } catch (error) {
        return Response.json(
          { error: error instanceof Error ? error.message : 'Bad request' },
          { status: 400 },
        )
      }
      const done = this.recording.then(() => this.record(body, Date.now()))
      this.recording = done.catch(() => {})
      await done
      return new Response(null, { status: 204 })
    }
    return super.fetch(request)
  }

  /** Adds the events into their buckets, then drops the buckets that left the window. */
  async record({ window, bucket, events }: RecordRequest, now: number): Promise<void> {
    const bucketMs = bucket * 1000
    const oldest = Math.floor((now - window * 1000) / bucketMs) * bucketMs + bucketMs
    const totals = new Map<number, Record<string, number>>()
    for (const event of events) {
      // Late (outside the window) or from a clock far ahead: nothing on the chart would show it.
      if (event.at < oldest || event.at > now + 60_000) continue
      const key = Math.floor(event.at / bucketMs) * bucket
      const sum = totals.get(key) ?? {}
      for (const [metric, value] of Object.entries(event.values)) {
        sum[metric] = (sum[metric] ?? 0) + value
      }
      totals.set(key, sum)
    }
    for (const [key, sum] of totals) {
      const path = `b/${key}`
      const stored = await this.read(path)
      const merged: Record<string, Json> = {}
      const previous =
        typeof stored === 'object' && stored !== null && !Array.isArray(stored) ? stored : {}
      for (const metric of new Set([...Object.keys(previous), ...Object.keys(sum)])) {
        const before = previous[metric]
        merged[metric] = (typeof before === 'number' ? before : 0) + (sum[metric] ?? 0)
      }
      await this.write(path, merged)
    }
    for (const path of await this.paths('b/')) {
      if (Number(path.slice(2)) * 1000 < oldest) await this.write(path, null)
    }
  }
}

/**
 * Adds events to the live room `name`: each is checked with `live.parseEvent` (one that fails
 * is logged and dropped, so one bad message cannot hold up a batch forever) and stamped with
 * the time now if it has none. Throws when the room cannot be reached, so a Queue retries the
 * batch — which, as with any Queue, can count a batch twice if only the reply was lost.
 */
export async function recordLive<M extends string, Id>(
  live: Live<M>,
  namespace: RoomNamespace<Id>,
  name: string,
  raw: readonly unknown[],
): Promise<void> {
  if (!/^[\w-]{1,64}$/.test(name)) throw new Error(`Invalid room name "${name}"`)
  const now = Date.now()
  const events: { at: number; values: LiveEvent<M>['values'] }[] = []
  for (const body of raw) {
    try {
      const event = live.parseEvent(body)
      events.push({ at: event.at ?? now, values: event.values })
    } catch (error) {
      console.warn(
        '[cascivo/live] dropped an event:',
        error instanceof Error ? error.message : error,
      )
    }
  }
  if (events.length === 0) return
  const response = await namespace.get(namespace.idFromName(name)).fetch(
    new Request('https://room.internal/live', {
      method: 'POST',
      headers: { [RECORD_HEADER]: '1', 'content-type': 'application/json' },
      body: JSON.stringify({ window: live.window, bucket: live.bucket, events }),
    }),
  )
  if (!response.ok) {
    throw new Error(
      `Recording into live room "${name}" failed: ${response.status} ${await response.text()}`,
    )
  }
}
