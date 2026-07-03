export type Interval = '10m' | '1h' | 'D' | 'W'

export const INTERVALS: Interval[] = ['10m', '1h', 'D', 'W']

export interface Instrument {
  id: string
  name: string
  /** ISIN-like identifier (fictional). */
  code: string
  currency: 'EUR'
  /** Seed + walk parameters used to synthesize a deterministic price history. */
  seed: number
  /** Starting price of the daily walk (~2 years ago). */
  start: number
  /** Per-candle geometric drift on the daily walk. */
  drift: number
  /** Per-step volatility. */
  vol: number
}

/**
 * A small catalog of fictional instruments. The flagship (`gti`) is tuned to
 * finish its ~2-year walk near €42.7 with a ~+33% arc, echoing the reference
 * screenshot without using any real ticker or brand.
 */
export const INSTRUMENTS: Instrument[] = [
  {
    id: 'gti',
    name: 'Global Tech Index USD (Acc)',
    code: 'IE00TECH0019',
    currency: 'EUR',
    seed: 0x7a11,
    start: 32.1,
    drift: 0.00058,
    vol: 0.009,
  },
  {
    id: 'nrg',
    name: 'Nordic Green Energy ETF',
    code: 'IE00GREN0027',
    currency: 'EUR',
    seed: 0x9c3d,
    start: 18.4,
    drift: 0.00021,
    vol: 0.012,
  },
  {
    id: 'wld',
    name: 'World Equity Core ETF',
    code: 'IE00WRLD0035',
    currency: 'EUR',
    seed: 0x2f88,
    start: 88.0,
    drift: 0.00034,
    vol: 0.006,
  },
  {
    id: 'gld',
    name: 'Physical Gold EUR (Acc)',
    code: 'IE00GOLD0042',
    currency: 'EUR',
    seed: 0x5be1,
    start: 61.5,
    drift: 0.0004,
    vol: 0.005,
  },
]

export const DEFAULT_INSTRUMENT_ID = 'gti'

export function getInstrument(id: string): Instrument {
  return INSTRUMENTS.find((i) => i.id === id) ?? INSTRUMENTS[0]!
}

export const VENUES = ['Best Price', 'Prime Exchange'] as const
export type Venue = (typeof VENUES)[number]
