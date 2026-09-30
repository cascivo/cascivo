import { computed, signal } from '@cascivo/core'
import type { ReadonlySignal } from '@cascivo/core'
import { connectRoom } from './sync'
import type { RoomOptions, RoomStatus } from './sync'

/**
 * `@cascivo/app/live` — dashboards that move as events arrive.
 *
 * Events go into a Queue. Its consumer adds them into per-second buckets in a `LiveRoom`
 * (`recordLive` from `@cascivo/app/live-server`), and every browser watching with `watchLive`
 * receives each bucket as it changes. The room keeps the last `window` seconds, so a new
 * viewer — or one coming back from a dropped connection — starts with the whole window.
 *
 * ```ts
 * // shared by both sides
 * export const ops = defineLive({ metrics: ['orders', 'revenue', 'errors'], window: 120 })
 * // browser
 * const live = watchLive(ops, '/api/live')
 * live.points.value // [{ at: 1727700000000, values: { orders: 4, revenue: 212, errors: 0 } }, …]
 * ```
 */

/** One event: amounts to add, per metric. */
export interface LiveEvent<M extends string> {
  /** When it happened, in ms since the epoch. Default: when the consumer records it. */
  at?: number
  values: Partial<Record<M, number>>
}

/** One bucket of the window. */
export interface LivePoint<M extends string> {
  /** When the bucket starts, in ms since the epoch. */
  at: number
  values: Record<M, number>
}

export interface Live<M extends string> {
  readonly metrics: readonly M[]
  /** Seconds of history the room keeps. */
  readonly window: number
  /** Seconds per bucket. */
  readonly bucket: number
  /** Checks one event that crossed the network (or a Queue). */
  parseEvent(raw: unknown): LiveEvent<M>
  /** Checks a list of at most 100 events — a Queue's `sendBatch` limit. */
  parseEvents(raw: unknown): LiveEvent<M>[]
  /** Checks one stored bucket; a metric it lacks is 0. */
  parseBucket(raw: unknown): Record<M, number>
  /** The start of the bucket `at` falls in, in ms. */
  bucketOf(at: number): number
  /**
   * The window ending at `now` as points, oldest first, with a zero point for each bucket
   * no event fell in. The newest bucket is still filling.
   */
  points(buckets: Readonly<Record<string, Record<M, number>>>, now: number): LivePoint<M>[]
}

/** Most events one `parseEvents` accepts: a Queue's `sendBatch` takes 100 messages. */
export const MAX_EVENTS = 100

const METRIC = /^[a-z][\w]{0,31}$/i

/** Declares a live dashboard's metrics, how much history it keeps and how fine its buckets are. */
export function defineLive<const M extends string>(definition: {
  metrics: readonly M[]
  /** Seconds of history kept. Default 120; at most 3600. */
  window?: number
  /** Seconds per bucket. Default 1. */
  bucket?: number
}): Live<M> {
  const { metrics, window = 120, bucket = 1 } = definition
  if (metrics.length === 0) throw new Error('A live dashboard needs at least one metric')
  for (const m of metrics) {
    if (!METRIC.test(m)) throw new Error(`Metric names are 1–32 letters, digits or _: "${m}"`)
  }
  if (!Number.isInteger(bucket) || bucket < 1)
    throw new Error('bucket is a whole number of seconds')
  if (!Number.isInteger(window) || window < bucket || window > 3600) {
    throw new Error('window is a whole number of seconds, from one bucket to 3600')
  }
  const zero = () => Object.fromEntries(metrics.map((m) => [m, 0])) as Record<M, number>

  const parseEvent = (raw: unknown): LiveEvent<M> => {
    if (typeof raw !== 'object' || raw === null) throw new Error('A live event is an object')
    const r = raw as Record<string, unknown>
    const at = r['at']
    if (at !== undefined && (typeof at !== 'number' || !Number.isFinite(at))) {
      throw new Error('A live event "at" is a time in ms')
    }
    const rawValues = r['values']
    if (typeof rawValues !== 'object' || rawValues === null) {
      throw new Error('A live event has "values"')
    }
    const values: Partial<Record<M, number>> = {}
    for (const [key, value] of Object.entries(rawValues)) {
      if (!(metrics as readonly string[]).includes(key)) throw new Error(`Unknown metric "${key}"`)
      if (typeof value !== 'number' || !Number.isFinite(value)) {
        throw new Error(`Metric "${key}" is not a number`)
      }
      // Checked against `metrics` above.
      values[key as M] = value
    }
    return at === undefined ? { values } : { at, values }
  }

  const bucketMs = bucket * 1000
  const bucketOf = (at: number) => Math.floor(at / bucketMs) * bucketMs

  return {
    metrics,
    window,
    bucket,
    parseEvent,
    parseEvents(raw) {
      if (!Array.isArray(raw)) throw new Error('Expected a list of events')
      if (raw.length > MAX_EVENTS) throw new Error(`At most ${MAX_EVENTS} events at a time`)
      return raw.map(parseEvent)
    },
    parseBucket(raw) {
      if (typeof raw !== 'object' || raw === null) throw new Error('A bucket is an object')
      const r = raw as Record<string, unknown>
      const values = zero()
      for (const m of metrics) {
        const value = r[m]
        if (typeof value === 'number' && Number.isFinite(value)) values[m] = value
      }
      return values
    },
    bucketOf,
    points(buckets, now) {
      const end = bucketOf(now)
      const out: LivePoint<M>[] = []
      for (let at = end - window * 1000 + bucketMs; at <= end; at += bucketMs) {
        out.push({ at, values: buckets[String(at / 1000)] ?? zero() })
      }
      return out
    },
  }
}

export interface WatchedLive<M extends string> {
  /** The window, oldest first; it slides every bucket, with or without events. */
  readonly points: ReadonlySignal<LivePoint<M>[]>
  /** The connection to the room. */
  readonly connection: ReadonlySignal<RoomStatus>
  /** Stops watching. */
  close(): void
}

/**
 * Watches a live room. `url` is where your Worker forwards the WebSocket — to
 * `roomResponse(request, env.LIVE, name, { readOnly: true })`. The window slides on this
 * device's clock, so a clock that is seconds off shows the newest buckets that much late or
 * early.
 */
export function watchLive<M extends string>(
  live: Live<M>,
  url: string,
  options: Pick<RoomOptions, 'WebSocket'> = {},
): WatchedLive<M> {
  const room = connectRoom(url, options)
  const buckets = room.map('b', live.parseBucket)
  const now = signal(Date.now())
  const clock = setInterval(() => {
    now.value = Date.now()
  }, live.bucket * 1000)
  return {
    points: computed(() => live.points(buckets.value, now.value)),
    connection: room.status,
    close() {
      clearInterval(clock)
      room.close()
    },
  }
}
