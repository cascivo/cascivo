import { computed, signal } from '@cascivo/core'
import { VENUES, type Venue } from '../data/instruments'
import type { Order } from '../data/seed'
import { ask, bid, selectedInstrumentId } from './market'
import { applyFill, cash, currentPosition, FEE } from './portfolio'

export type Side = 'buy' | 'sell'
export type OrderType = 'market' | 'limit' | 'stop'
export type Validity = 'today' | 'gtc'

export const side = signal<Side>('buy')
export const orderType = signal<OrderType>('market')
export const validity = signal<Validity>('today')
export const venue = signal<Venue>(VENUES[0])
export const shares = signal<number | null>(null)
/** Limit / stop price — only meaningful when orderType !== 'market'. */
export const limitPrice = signal<number | null>(null)

/** The price a market order would fill at right now. */
export const referencePrice = computed(() => (side.value === 'buy' ? ask.value : bid.value))

/** The effective execution price given the order type. */
export const execPrice = computed(() =>
  orderType.value === 'market' ? referencePrice.value : (limitPrice.value ?? referencePrice.value),
)

export const fees = computed(() => ((shares.value ?? 0) > 0 ? FEE : 0))

/** Buy cost (or sell proceeds) including fees. */
export const total = computed(() => {
  const n = shares.value ?? 0
  if (n <= 0) return 0
  const gross = n * execPrice.value
  return side.value === 'buy' ? gross + fees.value : gross - fees.value
})

/** How many shares of the selected instrument are held (for sell limits). */
const heldShares = computed(() =>
  currentPosition.value?.instrumentId === selectedInstrumentId.value
    ? (currentPosition.value?.shares ?? 0)
    : 0,
)

export const sharesError = computed<string | null>(() => {
  const n = shares.value ?? 0
  if (n <= 0) return null
  if (side.value === 'buy' && total.value > cash.value + 1e-6) return 'exceeds-cash'
  if (side.value === 'sell' && n > heldShares.value) return 'exceeds-holdings'
  return null
})

export const canSubmit = computed(() => (shares.value ?? 0) > 0 && sharesError.value === null)

/** Submit the ticket as an immediately-executed order. Returns it, or null. */
export function submit(): Order | null {
  if (!canSubmit.value) return null
  const n = shares.value!
  const order: Order = {
    id: `o-${Date.now()}`,
    instrumentId: selectedInstrumentId.value,
    status: 'executed',
    side: side.value,
    type: orderType.value,
    venue: venue.value,
    shares: n,
    price: Math.round(execPrice.value * 100) / 100,
    placed: Date.now(),
  }
  applyFill(order)
  shares.value = null
  return order
}
