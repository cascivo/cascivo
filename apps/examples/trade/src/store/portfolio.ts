import { computed, signal } from '@cascivo/core'
import { SEED_CASH, SEED_ORDERS, SEED_POSITIONS, type Order, type Position } from '../data/seed'
import { getInstrument } from '../data/instruments'
import { lastPrice, selectedInstrumentId } from './market'

export const cash = signal(SEED_CASH)
export const positions = signal<Position[]>(SEED_POSITIONS)
export const orders = signal<readonly Order[]>(SEED_ORDERS)

/** The holding (if any) in the currently-selected instrument. */
export const currentPosition = computed(() =>
  positions.value.find((p) => p.instrumentId === selectedInstrumentId.value),
)

/** Marked-to-market value of the current holding. */
export const positionValue = computed(() => {
  const p = currentPosition.value
  return p ? p.shares * lastPrice.value : 0
})

/** Return on the current holding, as a percentage of cost. */
export const returnPct = computed(() => {
  const p = currentPosition.value
  if (!p || p.costBasis === 0) return 0
  return (lastPrice.value / p.costBasis - 1) * 100
})

/**
 * Total portfolio value: cash plus every holding marked at its instrument's
 * starting price, except the selected one which is marked live.
 */
export const portfolioValue = computed(() => {
  let total = cash.value
  for (const p of positions.value) {
    const mark =
      p.instrumentId === selectedInstrumentId.value
        ? lastPrice.value
        : getInstrument(p.instrumentId).start
    total += p.shares * mark
  }
  return total
})

/** Count of orders for the selected instrument (for the summary "Activity"). */
export const activityCount = computed(
  () => orders.value.filter((o) => o.instrumentId === selectedInstrumentId.value).length,
)

const round2 = (n: number): number => Math.round(n * 100) / 100

/** Flat per-order fee, in euros. */
export const FEE = 1

/** Apply a filled order to cash + positions (weighted-average cost basis). */
export function applyFill(order: Order): void {
  const gross = order.shares * order.price
  cash.value = round2(order.side === 'buy' ? cash.value - gross - FEE : cash.value + gross - FEE)

  const list = positions.value.slice()
  const idx = list.findIndex((p) => p.instrumentId === order.instrumentId)
  const existing =
    idx >= 0 ? list[idx]! : { instrumentId: order.instrumentId, shares: 0, costBasis: order.price }
  if (order.side === 'buy') {
    const totalShares = existing.shares + order.shares
    const costBasis =
      totalShares > 0
        ? round2((existing.shares * existing.costBasis + order.shares * order.price) / totalShares)
        : order.price
    const next = { ...existing, shares: totalShares, costBasis }
    if (idx >= 0) list[idx] = next
    else list.push(next)
  } else {
    const next = { ...existing, shares: Math.max(0, existing.shares - order.shares) }
    if (idx >= 0) list[idx] = next
  }
  positions.value = list.filter((p) => p.shares > 0 || p.instrumentId === order.instrumentId)
  orders.value = [order, ...orders.value]
}
