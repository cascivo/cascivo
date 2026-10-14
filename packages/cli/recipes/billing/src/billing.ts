/**
 * The subscription plan /billing sells, shared by the Worker (worker/billing.ts) and the page.
 * A subscription belongs to a signed-in user, so this exists only with --auth email.
 */

/** The plan. The Worker sends this to Stripe; the page only displays it. */
export const PLAN = {
  name: 'Pro',
  description: 'Everything in the app, billed monthly. Cancel any time from the billing portal.',
  /** In the currency's smallest unit, per interval: 900 is €9.00. */
  amount: 900,
  currency: 'eur',
  interval: 'month' as const,
}

/** `none` before the first subscription; otherwise Stripe's subscription status. */
export type BillingStatus =
  | 'none'
  | 'incomplete'
  | 'incomplete_expired'
  | 'trialing'
  | 'active'
  | 'past_due'
  | 'canceled'
  | 'unpaid'
  | 'paused'

const STATUSES: readonly BillingStatus[] = [
  'none',
  'incomplete',
  'incomplete_expired',
  'trialing',
  'active',
  'past_due',
  'canceled',
  'unpaid',
  'paused',
]

export interface Billing {
  status: BillingStatus
  /**
   * Whether the plan's features are on: the subscription is active or trialing, or past due
   * while Stripe retries the renewal (`isEntitled` from @cascivo/app/stripe, in the Worker).
   */
  active: boolean
  /** When the current period ends: the next charge, or the end of a cancelled plan. */
  currentPeriodEnd: string | null
  /** Cancelled, but running until currentPeriodEnd. */
  cancelAtPeriodEnd: boolean
  /** Has a Stripe customer, so the billing portal can open. */
  canManage: boolean
}

export function parseBilling(raw: unknown): Billing {
  if (typeof raw === 'object' && raw !== null) {
    const { status, active, currentPeriodEnd, cancelAtPeriodEnd, canManage } = raw as Record<
      string,
      unknown
    >
    const known = STATUSES.find((s) => s === status)
    if (
      known &&
      typeof active === 'boolean' &&
      (currentPeriodEnd === null || typeof currentPeriodEnd === 'string') &&
      typeof cancelAtPeriodEnd === 'boolean' &&
      typeof canManage === 'boolean'
    ) {
      return { status: known, active, currentPeriodEnd, cancelAtPeriodEnd, canManage }
    }
  }
  throw new Error('Malformed billing')
}

/** Where to send the browser next: Stripe's checkout or its billing portal. */
export function parseRedirect(raw: unknown): { url: string } {
  if (typeof raw === 'object' && raw !== null) {
    const { url } = raw as Record<string, unknown>
    if (typeof url === 'string' && url.startsWith('https://')) return { url }
  }
  throw new Error('Malformed redirect')
}

export function parseSyncInput(raw: unknown): { sessionId: string } {
  if (typeof raw === 'object' && raw !== null) {
    const { sessionId } = raw as Record<string, unknown>
    if (typeof sessionId === 'string' && /^cs_[\w]{1,250}$/.test(sessionId)) return { sessionId }
  }
  throw new Error('Expected { sessionId }: a Checkout Session id')
}
