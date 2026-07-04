import { computed, createStreamBuffer, signal } from '@cascivo/core'
import { persistedSignal } from '@cascivo/storage'
import { buildMarket, type Book, type Trade } from '../data/seed'
import { getInstrument, DEFAULT_INSTRUMENT_ID, type Interval } from '../data/instruments'
import type { Candle } from '../data/candles'

export const selectedInstrumentId = persistedSignal<string>(
  'trade.instrument',
  DEFAULT_INSTRUMENT_ID,
)
export const selectedInstrument = computed(() => getInstrument(selectedInstrumentId.value))

// Live market state for the selected instrument.
export const lastPrice = signal(0)
export const prevClose = signal(0)
export const dayLow = signal(0)
export const dayHigh = signal(0)
export const book = signal<Book>({ bids: [], asks: [] })
export const candles = signal<Record<Interval, Candle[]>>({
  '10m': [],
  '1h': [],
  D: [],
  W: [],
})

/** Trade tape — a bounded ring buffer fed by the simulation. */
export const tape = createStreamBuffer<Trade>({ capacity: 64 })

export const bid = computed(() => book.value.bids[0]?.price ?? lastPrice.value)
export const ask = computed(() => book.value.asks[0]?.price ?? lastPrice.value)
export const changeAbs = computed(() => lastPrice.value - prevClose.value)
export const changePct = computed(() =>
  prevClose.value ? (changeAbs.value / prevClose.value) * 100 : 0,
)

/** Load a fresh deterministic snapshot for the given instrument. */
export function loadInstrument(id: string): void {
  const market = buildMarket(getInstrument(id))
  lastPrice.value = market.lastPrice
  prevClose.value = market.prevClose
  dayLow.value = market.dayLow
  dayHigh.value = market.dayHigh
  book.value = market.book
  candles.value = market.candles
  tape.clear()
  tape.appendMany(market.trades)
}

/** Switch the active instrument and reload its market snapshot. */
export function selectInstrument(id: string): void {
  selectedInstrumentId.value = id
  loadInstrument(id)
}

// Seed the store for the initially-selected instrument.
loadInstrument(selectedInstrumentId.value)
