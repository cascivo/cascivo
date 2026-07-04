import { seededRandom } from '@cascivo/example-kit'
import { aggregate, genCandles, INTERVAL_MS, type Candle } from './candles'
import { getInstrument, INSTRUMENTS, VENUES, type Instrument, type Interval } from './instruments'

export interface BookLevel {
  price: number
  size: number
}
export interface Book {
  bids: BookLevel[]
  asks: BookLevel[]
}
export interface Trade {
  id: number
  time: number
  price: number
  size: number
  side: 'buy' | 'sell'
}
export interface Order {
  id: string
  instrumentId: string
  status: 'executed' | 'open' | 'cancelled'
  side: 'buy' | 'sell'
  type: 'market' | 'limit' | 'stop'
  venue: string
  shares: number
  price: number
  placed: number
}
export interface Position {
  instrumentId: string
  shares: number
  costBasis: number
}

export interface SeedMarket {
  lastPrice: number
  prevClose: number
  dayLow: number
  dayHigh: number
  book: Book
  candles: Record<Interval, Candle[]>
  trades: Trade[]
}

/** Anchor "now" to the current 10-minute bucket so timestamps read as fresh. */
const NOW = Math.floor(Date.now() / INTERVAL_MS['10m']) * INTERVAL_MS['10m']
const floorTo = (ms: number): number => Math.floor(NOW / ms) * ms

const round2 = (n: number): number => Math.round(n * 100) / 100

/** Force a series to end exactly at `close`, keeping the high/low bracket valid. */
function anchorLast(candles: Candle[], close: number): Candle[] {
  const last = candles[candles.length - 1]
  if (!last) return candles
  last.close = close
  last.high = round2(Math.max(last.high, close, last.open))
  last.low = round2(Math.min(last.low, close, last.open))
  return candles
}

function genBook(seed: number, lastPrice: number): Book {
  const rng = seededRandom(seed ^ 0xb00c)
  const spread = Math.max(0.01, round2(lastPrice * 0.0004))
  const step = Math.max(0.01, round2(lastPrice * 0.0006))
  const bids: BookLevel[] = []
  const asks: BookLevel[] = []
  for (let i = 0; i < 8; i++) {
    bids.push({ price: round2(lastPrice - spread / 2 - i * step), size: rng.int(400, 9000) })
    asks.push({ price: round2(lastPrice + spread / 2 + i * step), size: rng.int(400, 9000) })
  }
  return { bids, asks }
}

/** Build the full deterministic market snapshot for one instrument. */
export function buildMarket(instrument: Instrument): SeedMarket {
  const daily = genCandles({
    seed: instrument.seed,
    count: 500,
    start: instrument.start,
    drift: instrument.drift,
    vol: instrument.vol,
    stepMs: INTERVAL_MS.D,
    endTime: floorTo(INTERVAL_MS.D),
  })
  const lastPrice = daily[daily.length - 1]!.close
  const prevClose = daily[daily.length - 2]?.close ?? lastPrice
  const lastDaily = daily[daily.length - 1]!

  const weekly = aggregate(daily, 5)
  const hourly = anchorLast(
    genCandles({
      seed: instrument.seed ^ 0x0a1,
      count: 48,
      start: lastPrice * 0.985,
      drift: instrument.drift * 6,
      vol: instrument.vol * 0.6,
      stepMs: INTERVAL_MS['1h'],
      endTime: floorTo(INTERVAL_MS['1h']),
    }),
    lastPrice,
  )
  const tenMin = anchorLast(
    genCandles({
      seed: instrument.seed ^ 0x0a2,
      count: 96,
      start: lastPrice * 0.992,
      drift: instrument.drift * 12,
      vol: instrument.vol * 0.4,
      stepMs: INTERVAL_MS['10m'],
      endTime: NOW,
    }),
    lastPrice,
  )

  const book = genBook(instrument.seed, lastPrice)
  const trades = seedTrades(instrument.seed, lastPrice, book)

  return {
    lastPrice,
    prevClose,
    dayLow: lastDaily.low,
    dayHigh: lastDaily.high,
    book,
    candles: { '10m': tenMin, '1h': hourly, D: daily, W: weekly },
    trades,
  }
}

/** A short backlog of trades so the tape isn't empty on first paint. */
function seedTrades(seed: number, lastPrice: number, book: Book): Trade[] {
  const rng = seededRandom(seed ^ 0x7ade)
  const out: Trade[] = []
  let t = NOW - 20 * 1500
  for (let i = 0; i < 20; i++) {
    const buy = rng.bool()
    out.push({
      id: i,
      time: t,
      price: buy ? book.asks[0]!.price : book.bids[0]!.price,
      size: rng.int(1, 300),
      side: buy ? 'buy' : 'sell',
    })
    t += rng.int(700, 2500)
  }
  return out
}

// ── Portfolio ────────────────────────────────────────────────────────────────

const gtiMarket = buildMarket(getInstrument('gti'))

/** One meaningful holding in the flagship, tuned to ≈ +33% return. */
export const SEED_POSITIONS: Position[] = [
  {
    instrumentId: 'gti',
    shares: Math.round(3625 / gtiMarket.lastPrice),
    costBasis: round2(gtiMarket.lastPrice / 1.3294),
  },
]

export const SEED_CASH = 12.11

/** A history of executed buys spread over the past months, across venues. */
export const SEED_ORDERS: Order[] = ((): Order[] => {
  const rng = seededRandom(0x0d5e)
  const out: Order[] = []
  const day = INTERVAL_MS.D
  for (let i = 0; i < 15; i++) {
    const inst = INSTRUMENTS[rng.int(0, INSTRUMENTS.length - 1)]!
    out.push({
      id: `seed-${i}`,
      instrumentId: inst.id,
      status: 'executed',
      side: 'buy',
      type: 'market',
      venue: VENUES[rng.int(0, VENUES.length - 1)]!,
      shares: rng.int(1, 40),
      price: round2(inst.start * (1 + rng.next() * 0.3)),
      placed: NOW - rng.int(1, 200) * day,
    })
  }
  return out.sort((a, b) => b.placed - a.placed)
})()

export { NOW }
