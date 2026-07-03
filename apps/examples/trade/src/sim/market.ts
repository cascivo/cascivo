import { createSimulation, type SeededRandom } from '@cascivo/example-kit'
import { INTERVALS } from '../data/instruments'
import type { Candle } from '../data/candles'
import { ask, bid, book, candles, dayHigh, dayLow, lastPrice, tape } from '../store/market'
import type { Book, Trade } from '../data/seed'

const round2 = (n: number): number => Math.round(n * 100) / 100

let tradeId = 100_000

/** Re-derive the book around a new mid price, jittering sizes. */
function walkBook(prev: Book, mid: number, rng: SeededRandom): Book {
  const spread = Math.max(0.01, round2(mid * 0.0004))
  const step = Math.max(0.01, round2(mid * 0.0006))
  const jitter = (size: number): number => Math.max(50, size + rng.int(-400, 400))
  return {
    bids: prev.bids.map((lvl, i) => ({
      price: round2(mid - spread / 2 - i * step),
      size: jitter(lvl.size),
    })),
    asks: prev.asks.map((lvl, i) => ({
      price: round2(mid + spread / 2 + i * step),
      size: jitter(lvl.size),
    })),
  }
}

/** Update the most recent candle of every interval so switching stays consistent. */
function nudgeCandles(price: number, addVolume: number): void {
  const next = { ...candles.value }
  for (const iv of INTERVALS) {
    const arr = next[iv]
    const last = arr[arr.length - 1]
    if (!last) continue
    const updated: Candle = {
      ...last,
      close: price,
      high: round2(Math.max(last.high, price)),
      low: round2(Math.min(last.low, price)),
      volume: last.volume + addVolume,
    }
    next[iv] = [...arr.slice(0, -1), updated]
  }
  candles.value = next
}

export const marketSim = createSimulation({
  tickMs: 800,
  seed: 0xf00d,
  onTick: (rng) => {
    // Random-walk the last price with a faint upward drift.
    const shock = (rng.next() * 2 - 1) * 0.0005 + 0.00002
    const price = round2(Math.max(0.01, lastPrice.value * (1 + shock)))
    lastPrice.value = price

    if (price < dayLow.value) dayLow.value = price
    if (price > dayHigh.value) dayHigh.value = price

    book.value = walkBook(book.value, price, rng)

    // Emit 0–2 trades at the touch.
    const n = rng.int(0, 2)
    let tickVolume = 0
    for (let i = 0; i < n; i++) {
      const buy = rng.bool(0.5)
      const size = rng.int(1, 300)
      tickVolume += size
      const trade: Trade = {
        id: tradeId++,
        time: Date.now(),
        price: buy ? ask.value : bid.value,
        size,
        side: buy ? 'buy' : 'sell',
      }
      tape.append(trade)
    }

    nudgeCandles(price, tickVolume)
  },
})
