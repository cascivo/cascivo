import { seededRandom } from '@cascivo/example-kit'
import type { Interval } from './instruments'

export interface Candle {
  /** Bucket start, epoch ms. */
  t: number
  open: number
  high: number
  low: number
  close: number
  volume: number
}

/** Milliseconds per interval bucket. */
export const INTERVAL_MS: Record<Interval, number> = {
  '10m': 10 * 60_000,
  '1h': 60 * 60_000,
  D: 24 * 60 * 60_000,
  W: 7 * 24 * 60 * 60_000,
}

const round2 = (n: number): number => Math.round(n * 100) / 100

export interface GenOptions {
  seed: number
  count: number
  start: number
  drift: number
  vol: number
  stepMs: number
  /** Bucket start of the final (most recent) candle. */
  endTime: number
}

/**
 * A deterministic OHLCV walk. Each candle takes a few intra-bucket steps so the
 * high/low bracket the open/close by construction (the tested invariant).
 */
export function genCandles(opts: GenOptions): Candle[] {
  const { seed, count, start, drift, vol, stepMs, endTime } = opts
  const rng = seededRandom(seed)
  const out: Candle[] = []
  let price = start
  let t = endTime - (count - 1) * stepMs
  for (let i = 0; i < count; i++) {
    const open = price
    let cur = open
    let hi = open
    let lo = open
    for (let s = 0; s < 4; s++) {
      const shock = (rng.next() * 2 - 1) * vol + drift
      cur = Math.max(0.01, cur * (1 + shock))
      if (cur > hi) hi = cur
      if (cur < lo) lo = cur
    }
    const close = cur
    out.push({
      t,
      open: round2(open),
      high: round2(hi),
      low: round2(lo),
      close: round2(close),
      volume: rng.int(1200, 9000),
    })
    price = close
    t += stepMs
  }
  return out
}

/**
 * Aggregate consecutive candles into coarser buckets (e.g. daily → weekly).
 * open = first.open, close = last.close, high/low = extremes, volume = sum.
 */
export function aggregate(candles: readonly Candle[], groupSize: number): Candle[] {
  const out: Candle[] = []
  for (let i = 0; i < candles.length; i += groupSize) {
    const group = candles.slice(i, i + groupSize)
    if (group.length === 0) continue
    const first = group[0]!
    const last = group[group.length - 1]!
    out.push({
      t: first.t,
      open: first.open,
      high: Math.max(...group.map((c) => c.high)),
      low: Math.min(...group.map((c) => c.low)),
      close: last.close,
      volume: group.reduce((sum, c) => sum + c.volume, 0),
    })
  }
  return out
}
