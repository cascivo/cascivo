/**
 * What /checkout sells and the orders it makes, shared by the Worker (which creates them and
 * hears from Stripe) and the pages (which show them).
 */

/** The seller, as the receipt names it. */
export const SHOP_NAME = 'Cascivo Shop'

/**
 * What you sell. The Worker sends this to Stripe, so a browser cannot change the price; the
 * page only displays it.
 */
export const PRODUCT = {
  name: 'Sticker pack',
  description: 'Twelve vinyl stickers of your favourite components, shipped worldwide.',
  /** In the currency's smallest unit: 900 is €9.00. */
  amount: 900,
  /** Three-letter ISO code, lowercase. */
  currency: 'eur',
}

/** `pending` until Stripe confirms the payment; the other three are final. */
export type OrderStatus = 'pending' | 'paid' | 'failed' | 'expired'

export interface Order {
  id: string
  status: OrderStatus
  /** What Stripe charged, in the currency's smallest unit. */
  amount: number
  currency: string
  createdAt: string
  paidAt: string | null
}

/** An order id: a UUID the Worker made. */
export const ORDER_ID = /^[0-9a-f-]{36}$/

/** The room the Worker pushes an order's changes to; its page watches it. */
export const orderRoom = (id: string) => `order-${id}`

/** A price in the currency's smallest unit, for people: 900 eur is €9.00, 900 jpy is ¥900. */
export function formatPrice(amount: number, currency: string): string {
  const format = new Intl.NumberFormat(undefined, { style: 'currency', currency })
  const digits = format.resolvedOptions().maximumFractionDigits ?? 2
  return format.format(amount / 10 ** digits)
}

const STATUSES = ['pending', 'paid', 'failed', 'expired']

export function parseOrder(raw: unknown): Order {
  if (typeof raw === 'object' && raw !== null) {
    const { id, status, amount, currency, createdAt, paidAt } = raw as Record<string, unknown>
    if (
      typeof id === 'string' &&
      typeof status === 'string' &&
      STATUSES.includes(status) &&
      typeof amount === 'number' &&
      typeof currency === 'string' &&
      typeof createdAt === 'string' &&
      (paidAt === null || typeof paidAt === 'string')
    ) {
      // Checked against STATUSES just above.
      return { id, status: status as OrderStatus, amount, currency, createdAt, paidAt }
    }
  }
  throw new Error('Malformed order')
}

export function parseCheckoutStarted(raw: unknown): { url: string } {
  if (typeof raw === 'object' && raw !== null) {
    const { url } = raw as Record<string, unknown>
    if (typeof url === 'string' && url.startsWith('https://')) return { url }
  }
  throw new Error('Malformed checkout')
}
