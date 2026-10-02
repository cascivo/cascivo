/**
 * `@cascivo/app/stripe` — taking a payment with Stripe Checkout, from a Worker.
 *
 * ```ts
 * const stripe = createStripe(env.STRIPE_SECRET_KEY)
 * const session = await stripe.createCheckoutSession({
 *   mode: 'payment',
 *   lineItems: [{ name: 'Sticker pack', amount: 900, currency: 'eur', quantity: 1 }],
 *   successUrl: `${origin}/thanks?order=${orderId}`,
 *   cancelUrl: `${origin}/shop`,
 *   clientReferenceId: orderId,
 * })
 * // redirect the browser to session.url; Stripe's hosted page takes the card.
 *
 * // The webhook: verify first (@cascivo/app/guard), then parse.
 * const { body } = await verifyWebhook(request, { scheme: 'stripe', secret: env.STRIPE_WEBHOOK_SECRET })
 * const event = parseStripeEvent(body)
 * if (event.kind === 'checkout') …event.session.paymentStatus…
 * ```
 *
 * Plain `fetch` against Stripe's REST API: no SDK, no Node.js APIs. It covers what hosted
 * Checkout needs; for anything else, install the `stripe` package, which runs on Workers too.
 */

import { HttpError } from '@cascivo/data'

const API = 'https://api.stripe.com/v1'

/** A refusal from Stripe's API: a bad key, an invalid parameter, a declined request. */
export class StripeError extends Error {
  /** The HTTP status Stripe answered with. */
  readonly status: number
  /** Stripe's error type, e.g. `invalid_request_error`, when it sent one. */
  readonly type: string | null
  /** Stripe's error code, e.g. `parameter_missing`, when it sent one. */
  readonly code: string | null

  constructor(status: number, message: string, type: string | null, code: string | null) {
    super(message)
    this.name = 'StripeError'
    this.status = status
    this.type = type
    this.code = code
  }
}

/** One thing in the basket: a Price made in the Stripe dashboard, or one described here. */
export type CheckoutLineItem =
  | {
      /** A Price id from the dashboard (`price_…`). */
      price: string
      quantity: number
    }
  | {
      name: string
      description?: string
      /** In the currency's smallest unit: cents for EUR and USD. */
      amount: number
      /** Three-letter ISO code, lowercase: `eur`, `usd`. */
      currency: string
      quantity: number
      /** Bills it every interval: a recurring price, for `mode: 'subscription'`. */
      interval?: 'day' | 'week' | 'month' | 'year'
    }

export interface CheckoutSessionParams {
  /** A one-off payment, or a subscription (its line items need recurring prices). */
  mode: 'payment' | 'subscription'
  lineItems: CheckoutLineItem[]
  /** Where Stripe sends the buyer after paying. */
  successUrl: string
  /** Where Stripe sends the buyer who goes back. */
  cancelUrl: string
  /** Fills in the email field on Stripe's page. */
  customerEmail?: string
  /**
   * An existing Stripe customer (`cus_…`), such as a returning subscriber's, so their
   * subscriptions and invoices stay in one place. Use it instead of `customerEmail`.
   */
  customer?: string
  /**
   * Your own id for this purchase; every event about the session carries it back. A buyer can
   * set it on a Payment Link, so do not let it decide who gets what.
   */
  clientReferenceId?: string
  metadata?: Record<string, string>
  /**
   * Copied onto the subscription Stripe creates (`mode: 'subscription'`), and so onto every
   * subscription event. Only your server can set it, so it can name the user it belongs to.
   */
  subscriptionMetadata?: Record<string, string>
}

export interface CheckoutSession {
  id: string
  mode: 'payment' | 'subscription' | 'setup'
  /** Stripe's hosted page, while the session is open. */
  url: string | null
  status: 'open' | 'complete' | 'expired'
  /**
   * `unpaid` on a `complete` session means a delayed method (a bank debit) has not settled:
   * wait for `checkout.session.async_payment_succeeded`.
   */
  paymentStatus: 'paid' | 'unpaid' | 'no_payment_required'
  /** In the currency's smallest unit. */
  amountTotal: number | null
  currency: string | null
  /** The email the buyer gave on Stripe's page. */
  customerEmail: string | null
  clientReferenceId: string | null
  metadata: Record<string, string>
  /** The Stripe customer (`cus_…`), once the session made or used one. */
  customerId: string | null
  /** The subscription (`sub_…`) a completed subscription session created. */
  subscriptionId: string | null
  /**
   * The PaymentIntent (`pi_…`) of a payment session. Refund and dispute events name the
   * payment by it, so store it with the order.
   */
  paymentIntentId: string | null
  livemode: boolean
}

export type SubscriptionStatus =
  | 'incomplete'
  | 'incomplete_expired'
  | 'trialing'
  | 'active'
  | 'past_due'
  | 'canceled'
  | 'unpaid'
  | 'paused'

export interface Subscription {
  id: string
  /** `active` and `trialing` are paying (or about to); the rest are not, or not yet. */
  status: SubscriptionStatus
  customerId: string
  /** Seconds since the epoch: when the current period ends and the next charge is due. */
  currentPeriodEnd: number | null
  /** Cancelled, but running until `currentPeriodEnd`. */
  cancelAtPeriodEnd: boolean
  /** The first item's price (`price_…`): which plan this is. */
  priceId: string | null
  metadata: Record<string, string>
  livemode: boolean
}

/** A charge, as `charge.refunded` carries it. */
export interface Charge {
  id: string
  /** The PaymentIntent it belongs to: how to find the order. */
  paymentIntentId: string | null
  /** In the currency's smallest unit. */
  amount: number
  /** Everything refunded so far, in total: not the amount of this one refund. */
  amountRefunded: number
  /** Refunded in full. */
  refunded: boolean
  currency: string
}

/**
 * A dispute (chargeback). Its `status` is Stripe's own string: `needs_response` and
 * `under_review` while open, `won` or `lost` once closed, and a few more Stripe may add.
 */
export interface Dispute {
  id: string
  chargeId: string | null
  paymentIntentId: string | null
  /** What is disputed, in the currency's smallest unit. */
  amount: number
  currency: string
  status: string
  /** Why the cardholder disputed it, e.g. `fraudulent` or `product_not_received`. */
  reason: string | null
}

export type InvoiceStatus = 'draft' | 'open' | 'paid' | 'uncollectible' | 'void'

/** An invoice: each subscription period is billed by one. */
export interface Invoice {
  id: string
  customerId: string | null
  /** The subscription it bills, when it bills one. */
  subscriptionId: string | null
  status: InvoiceStatus | null
  /** In the currency's smallest unit. */
  amountDue: number
  amountPaid: number
  currency: string
  customerEmail: string | null
  /** Stripe's hosted page where the customer can see the invoice and pay it with another card. */
  hostedInvoiceUrl: string | null
  /** How many times Stripe has tried to collect it. */
  attemptCount: number
  /** Seconds since the epoch of Stripe's next try, or `null` when it will not try again. */
  nextPaymentAttempt: number | null
  /** Why it exists: `subscription_create`, `subscription_cycle` (a renewal), `manual`… */
  billingReason: string | null
}

/** A refund `createRefund` made. */
export interface Refund {
  id: string
  /** `pending`, `succeeded`, `failed`, `canceled` or `requires_action`. */
  status: string
  amount: number
  currency: string
  paymentIntentId: string | null
}

export interface RefundParams {
  /** The PaymentIntent to refund (`pi_…`), as a Checkout session or an event names it. */
  paymentIntent: string
  /** Part of it, in the currency's smallest unit. Default: whatever is left. */
  amount?: number
  reason?: 'duplicate' | 'fraudulent' | 'requested_by_customer'
  metadata?: Record<string, string>
}

export interface StripeOptions {
  /**
   * The API version to pin (`Stripe-Version`), so upgrading the account cannot change a
   * response under a deployed app. Default: the account's own version.
   */
  apiVersion?: string
  /** Stand-in for the global `fetch`, for tests. */
  fetch?: typeof fetch
}

export interface Stripe {
  /**
   * Creates a Checkout Session; send the browser to its `url`. An `idempotencyKey` (your
   * order id) makes a retried call return the first session instead of creating another.
   */
  createCheckoutSession(
    params: CheckoutSessionParams,
    options?: { idempotencyKey?: string },
  ): Promise<CheckoutSession>
  /** Reads a session back: whether it was paid, without waiting for the webhook. */
  retrieveCheckoutSession(id: string): Promise<CheckoutSession>
  /** Reads a subscription's current state: what to store, whatever order events came in. */
  retrieveSubscription(id: string): Promise<Subscription>
  /**
   * Opens Stripe's hosted Customer Portal for a customer: their plan, cards, invoices and
   * cancellation. Send the browser to the `url`; Stripe sends it back to `returnUrl`. Save the
   * portal's settings once in the dashboard first (test mode too), or Stripe refuses.
   */
  createPortalSession(params: { customer: string; returnUrl: string }): Promise<{ url: string }>
  /**
   * Refunds a payment, in full or in part. Pass an `idempotencyKey` (the order id plus what
   * the refund is for), so a retried call does not refund twice. Stripe then sends
   * `charge.refunded`, which is where the order should change.
   */
  createRefund(params: RefundParams, options?: { idempotencyKey?: string }): Promise<Refund>
}

/** Stripe's form encoding: nested keys in brackets, `line_items[0][quantity]=1`. */
function formBody(params: CheckoutSessionParams): URLSearchParams {
  const form = new URLSearchParams()
  form.set('mode', params.mode)
  form.set('success_url', params.successUrl)
  form.set('cancel_url', params.cancelUrl)
  if (params.customerEmail !== undefined) form.set('customer_email', params.customerEmail)
  if (params.customer !== undefined) form.set('customer', params.customer)
  if (params.clientReferenceId !== undefined) {
    form.set('client_reference_id', params.clientReferenceId)
  }
  for (const [key, value] of Object.entries(params.metadata ?? {})) {
    form.set(`metadata[${key}]`, value)
  }
  for (const [key, value] of Object.entries(params.subscriptionMetadata ?? {})) {
    form.set(`subscription_data[metadata][${key}]`, value)
  }
  params.lineItems.forEach((item, i) => {
    const at = `line_items[${i}]`
    form.set(`${at}[quantity]`, String(item.quantity))
    if ('price' in item) {
      form.set(`${at}[price]`, item.price)
      return
    }
    form.set(`${at}[price_data][currency]`, item.currency)
    form.set(`${at}[price_data][unit_amount]`, String(item.amount))
    form.set(`${at}[price_data][product_data][name]`, item.name)
    if (item.interval !== undefined) {
      form.set(`${at}[price_data][recurring][interval]`, item.interval)
    }
    if (item.description !== undefined) {
      form.set(`${at}[price_data][product_data][description]`, item.description)
    }
  })
  return form
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value)

const stringOrNull = (value: unknown): string | null => (typeof value === 'string' ? value : null)

const SESSION_STATUSES = ['open', 'complete', 'expired'] as const
const PAYMENT_STATUSES = ['paid', 'unpaid', 'no_payment_required'] as const
const SESSION_MODES = ['payment', 'subscription', 'setup'] as const
const SUBSCRIPTION_STATUSES: readonly SubscriptionStatus[] = [
  'incomplete',
  'incomplete_expired',
  'trialing',
  'active',
  'past_due',
  'canceled',
  'unpaid',
  'paused',
]

/** An id Stripe sends as a string, or as the object itself when it was expanded. */
function idOf(value: unknown): string | null {
  if (typeof value === 'string') return value
  return isRecord(value) ? stringOrNull(value['id']) : null
}

function stringMap(raw: unknown): Record<string, string> {
  const out: Record<string, string> = {}
  if (isRecord(raw)) {
    for (const [key, value] of Object.entries(raw)) {
      if (typeof value === 'string') out[key] = value
    }
  }
  return out
}

function oneOf<T extends string>(list: readonly T[], value: unknown): T | null {
  return list.find((item) => item === value) ?? null
}

/**
 * Parses a Checkout Session as Stripe sends it (API response or event), reading only the
 * fields this module types. Throws on a missing id or an unknown status.
 */
export function parseCheckoutSession(raw: unknown): CheckoutSession {
  if (!isRecord(raw) || raw['object'] !== 'checkout.session' || typeof raw['id'] !== 'string') {
    throw new Error('Expected a Stripe Checkout Session')
  }
  const status = oneOf(SESSION_STATUSES, raw['status'])
  const paymentStatus = oneOf(PAYMENT_STATUSES, raw['payment_status'])
  const mode = oneOf(SESSION_MODES, raw['mode'])
  if (!status || !paymentStatus || !mode) {
    throw new Error(`Checkout Session ${raw['id']} has an unknown status or mode`)
  }
  const details = raw['customer_details']
  const amount = raw['amount_total']
  return {
    id: raw['id'],
    mode,
    url: stringOrNull(raw['url']),
    status,
    paymentStatus,
    amountTotal: typeof amount === 'number' ? amount : null,
    currency: stringOrNull(raw['currency']),
    customerEmail:
      (isRecord(details) ? stringOrNull(details['email']) : null) ??
      stringOrNull(raw['customer_email']),
    clientReferenceId: stringOrNull(raw['client_reference_id']),
    metadata: stringMap(raw['metadata']),
    customerId: idOf(raw['customer']),
    subscriptionId: idOf(raw['subscription']),
    paymentIntentId: idOf(raw['payment_intent']),
    livemode: raw['livemode'] === true,
  }
}

/**
 * Parses a subscription as Stripe sends it. Newer API versions moved the billing period from
 * the subscription onto its items; both places are read.
 */
export function parseSubscription(raw: unknown): Subscription {
  if (!isRecord(raw) || raw['object'] !== 'subscription' || typeof raw['id'] !== 'string') {
    throw new Error('Expected a Stripe subscription')
  }
  const status = oneOf(SUBSCRIPTION_STATUSES, raw['status'])
  const customerId = idOf(raw['customer'])
  if (!status || !customerId) {
    throw new Error(`Subscription ${raw['id']} has an unknown status or no customer`)
  }
  const items = raw['items']
  const list = isRecord(items) && Array.isArray(items['data']) ? items['data'] : []
  const first: unknown = list[0]
  const item = isRecord(first) ? first : {}
  const periodEnd = raw['current_period_end'] ?? item['current_period_end']
  return {
    id: raw['id'],
    status,
    customerId,
    currentPeriodEnd: typeof periodEnd === 'number' ? periodEnd : null,
    cancelAtPeriodEnd: raw['cancel_at_period_end'] === true,
    priceId: idOf(item['price']),
    metadata: stringMap(raw['metadata']),
    livemode: raw['livemode'] === true,
  }
}

const numberOr = (value: unknown, fallback: number): number =>
  typeof value === 'number' && Number.isFinite(value) ? value : fallback

/** An object of the named type with a string id, or a throw naming what was expected. */
function stripeObject(
  raw: unknown,
  object: string,
  label: string,
): Record<string, unknown> & { id: string } {
  if (!isRecord(raw) || raw['object'] !== object || typeof raw['id'] !== 'string') {
    throw new Error(`Expected a Stripe ${label}`)
  }
  return raw as Record<string, unknown> & { id: string }
}

/** A currency and an amount every payment object carries: without them it is not one. */
function money(raw: Record<string, unknown>, field: string, label: string) {
  const amount = raw[field]
  const currency = raw['currency']
  if (typeof amount !== 'number' || typeof currency !== 'string') {
    throw new Error(`${label} ${String(raw['id'])} has no amount or currency`)
  }
  return { amount, currency }
}

/** Parses a charge as Stripe sends it, reading only the fields `Charge` types. */
export function parseCharge(raw: unknown): Charge {
  const charge = stripeObject(raw, 'charge', 'charge')
  const { amount, currency } = money(charge, 'amount', 'Charge')
  return {
    id: charge.id,
    paymentIntentId: idOf(charge['payment_intent']),
    amount,
    amountRefunded: numberOr(charge['amount_refunded'], 0),
    refunded: charge['refunded'] === true,
    currency,
  }
}

/** Parses a dispute as Stripe sends it, reading only the fields `Dispute` types. */
export function parseDispute(raw: unknown): Dispute {
  const dispute = stripeObject(raw, 'dispute', 'dispute')
  const { amount, currency } = money(dispute, 'amount', 'Dispute')
  const status = dispute['status']
  if (typeof status !== 'string') throw new Error(`Dispute ${dispute.id} has no status`)
  return {
    id: dispute.id,
    chargeId: idOf(dispute['charge']),
    paymentIntentId: idOf(dispute['payment_intent']),
    amount,
    currency,
    status,
    reason: stringOrNull(dispute['reason']),
  }
}

const INVOICE_STATUSES: readonly InvoiceStatus[] = [
  'draft',
  'open',
  'paid',
  'uncollectible',
  'void',
]

/**
 * Parses an invoice as Stripe sends it. Newer API versions moved its subscription under
 * `parent.subscription_details`; both places are read.
 */
export function parseInvoice(raw: unknown): Invoice {
  const invoice = stripeObject(raw, 'invoice', 'invoice')
  const currency = invoice['currency']
  if (typeof currency !== 'string') throw new Error(`Invoice ${invoice.id} has no currency`)
  const parent = invoice['parent']
  const details = isRecord(parent) ? parent['subscription_details'] : null
  const next = invoice['next_payment_attempt']
  return {
    id: invoice.id,
    customerId: idOf(invoice['customer']),
    subscriptionId:
      idOf(invoice['subscription']) ?? (isRecord(details) ? idOf(details['subscription']) : null),
    status: oneOf(INVOICE_STATUSES, invoice['status']),
    amountDue: numberOr(invoice['amount_due'], 0),
    amountPaid: numberOr(invoice['amount_paid'], 0),
    currency,
    customerEmail: stringOrNull(invoice['customer_email']),
    hostedInvoiceUrl: stringOrNull(invoice['hosted_invoice_url']),
    attemptCount: numberOr(invoice['attempt_count'], 0),
    nextPaymentAttempt: typeof next === 'number' ? next : null,
    billingReason: stringOrNull(invoice['billing_reason']),
  }
}

function parseRefund(raw: unknown): Refund {
  const refund = stripeObject(raw, 'refund', 'refund')
  const { amount, currency } = money(refund, 'amount', 'Refund')
  return {
    id: refund.id,
    status: stringOrNull(refund['status']) ?? 'pending',
    amount,
    currency,
    paymentIntentId: idOf(refund['payment_intent']),
  }
}

/**
 * Whether a subscription's status unlocks what it pays for: `active` and `trialing` do, and
 * `past_due` does too while Stripe retries a failed renewal, unless `pastDue` is `false`. How
 * long that lasts is set in the Stripe dashboard (Billing → Subscriptions and emails →
 * Manage failed payments), which ends it as `canceled` or `unpaid`: one place decides the
 * grace period. Anything else, `null` (no subscription) and an unknown status do not.
 */
export function isEntitled(
  status: string | null | undefined,
  options: { pastDue?: boolean } = {},
): boolean {
  if (status === 'active' || status === 'trialing') return true
  return status === 'past_due' && options.pastDue !== false
}

/**
 * Throws `HttpError(402)` unless `isEntitled(status, options)`: call it in the Worker before
 * serving a paid feature, with the status stored from the subscription events.
 */
export function requireEntitlement(
  status: string | null | undefined,
  options: { pastDue?: boolean } = {},
): void {
  if (!isEntitled(status, options)) {
    throw new HttpError(402, 'This needs an active subscription')
  }
}

/** Creates a client for Stripe's API with a secret key (`sk_test_…` or `sk_live_…`). */
export function createStripe(secretKey: string, options: StripeOptions = {}): Stripe {
  if (!secretKey) throw new Error('createStripe: no secret key configured')
  const send = options.fetch ?? fetch

  async function call(
    method: 'GET' | 'POST',
    path: string,
    body?: URLSearchParams,
    idempotencyKey?: string,
  ): Promise<unknown> {
    const headers: Record<string, string> = { authorization: `Bearer ${secretKey}` }
    if (body) headers['content-type'] = 'application/x-www-form-urlencoded'
    if (options.apiVersion) headers['stripe-version'] = options.apiVersion
    if (idempotencyKey) headers['idempotency-key'] = idempotencyKey
    const response = await send(`${API}${path}`, {
      method,
      headers,
      ...(body ? { body: body.toString() } : {}),
    })
    let payload: unknown = null
    try {
      payload = await response.json()
    } catch {
      // A body that is not JSON: the status alone tells what went wrong.
    }
    if (!response.ok) {
      const error = isRecord(payload) ? payload['error'] : null
      const detail = isRecord(error) ? error : {}
      throw new StripeError(
        response.status,
        stringOrNull(detail['message']) ?? `Stripe answered ${response.status}`,
        stringOrNull(detail['type']),
        stringOrNull(detail['code']),
      )
    }
    return payload
  }

  return {
    async createCheckoutSession(params, callOptions = {}) {
      const raw = await call(
        'POST',
        '/checkout/sessions',
        formBody(params),
        callOptions.idempotencyKey,
      )
      return parseCheckoutSession(raw)
    },
    async retrieveCheckoutSession(id) {
      return parseCheckoutSession(await call('GET', `/checkout/sessions/${encodeURIComponent(id)}`))
    },
    async retrieveSubscription(id) {
      return parseSubscription(await call('GET', `/subscriptions/${encodeURIComponent(id)}`))
    },
    async createPortalSession({ customer, returnUrl }) {
      const form = new URLSearchParams({ customer, return_url: returnUrl })
      const raw = await call('POST', '/billing_portal/sessions', form)
      const url = isRecord(raw) ? raw['url'] : null
      if (typeof url !== 'string') throw new Error('Stripe returned no portal URL')
      return { url }
    },
    async createRefund(params, callOptions = {}) {
      const form = new URLSearchParams({ payment_intent: params.paymentIntent })
      if (params.amount !== undefined) form.set('amount', String(params.amount))
      if (params.reason !== undefined) form.set('reason', params.reason)
      for (const [key, value] of Object.entries(params.metadata ?? {})) {
        form.set(`metadata[${key}]`, value)
      }
      return parseRefund(await call('POST', '/refunds', form, callOptions.idempotencyKey))
    },
  }
}

/** The Checkout events a fulfilment handler acts on. */
export type CheckoutEventType =
  | 'checkout.session.completed'
  | 'checkout.session.async_payment_succeeded'
  | 'checkout.session.async_payment_failed'
  | 'checkout.session.expired'

const CHECKOUT_EVENTS: readonly CheckoutEventType[] = [
  'checkout.session.completed',
  'checkout.session.async_payment_succeeded',
  'checkout.session.async_payment_failed',
  'checkout.session.expired',
]

interface EventBase {
  /** `evt_…`. A retried delivery keeps it. */
  id: string
  /** Seconds since the epoch. Events can arrive out of order: compare this, not arrival. */
  created: number
  livemode: boolean
}

/** The subscription events a billing handler acts on. */
export type SubscriptionEventType =
  | 'customer.subscription.created'
  | 'customer.subscription.updated'
  | 'customer.subscription.deleted'

const SUBSCRIPTION_EVENTS: readonly SubscriptionEventType[] = [
  'customer.subscription.created',
  'customer.subscription.updated',
  'customer.subscription.deleted',
]

/** The dispute events: one opened, and one decided (`won` or `lost`). */
export type DisputeEventType = 'charge.dispute.created' | 'charge.dispute.closed'

const DISPUTE_EVENTS: readonly DisputeEventType[] = [
  'charge.dispute.created',
  'charge.dispute.closed',
]

/** The invoice events a billing handler acts on: a renewal paid, or a renewal that failed. */
export type InvoiceEventType = 'invoice.paid' | 'invoice.payment_failed'

const INVOICE_EVENTS: readonly InvoiceEventType[] = ['invoice.paid', 'invoice.payment_failed']

export type StripeEvent =
  | (EventBase & { kind: 'checkout'; type: CheckoutEventType; session: CheckoutSession })
  /** A refund, full or partial: `charge.amountRefunded` is the running total. */
  | (EventBase & { kind: 'refund'; type: 'charge.refunded'; charge: Charge })
  | (EventBase & { kind: 'dispute'; type: DisputeEventType; dispute: Dispute })
  | (EventBase & { kind: 'invoice'; type: InvoiceEventType; invoice: Invoice })
  /**
   * The subscription as it was when the event was made. Events arrive out of order: read the
   * current state back with `retrieveSubscription` before storing it.
   */
  | (EventBase & {
      kind: 'subscription'
      type: SubscriptionEventType
      subscription: Subscription
    })
  /** Any other event: acknowledge it, so Stripe stops retrying it. */
  | (EventBase & { kind: 'other'; type: string })

/**
 * Parses a webhook body that `verifyWebhook` (scheme `stripe`) has already checked. The
 * signature proves Stripe sent it, not its shape, so the fields are read one by one.
 */
export function parseStripeEvent(body: string): StripeEvent {
  let raw: unknown
  try {
    raw = JSON.parse(body)
  } catch {
    throw new Error('A Stripe event is JSON')
  }
  if (
    !isRecord(raw) ||
    raw['object'] !== 'event' ||
    typeof raw['id'] !== 'string' ||
    typeof raw['type'] !== 'string' ||
    typeof raw['created'] !== 'number'
  ) {
    throw new Error('Expected a Stripe event')
  }
  const base = { id: raw['id'], created: raw['created'], livemode: raw['livemode'] === true }
  const data = raw['data']
  const object = isRecord(data) ? data['object'] : null
  const subscriptionType = oneOf(SUBSCRIPTION_EVENTS, raw['type'])
  if (subscriptionType) {
    return {
      ...base,
      kind: 'subscription',
      type: subscriptionType,
      subscription: parseSubscription(object),
    }
  }
  if (raw['type'] === 'charge.refunded') {
    return { ...base, kind: 'refund', type: 'charge.refunded', charge: parseCharge(object) }
  }
  const disputeType = oneOf(DISPUTE_EVENTS, raw['type'])
  if (disputeType)
    return { ...base, kind: 'dispute', type: disputeType, dispute: parseDispute(object) }
  const invoiceType = oneOf(INVOICE_EVENTS, raw['type'])
  if (invoiceType)
    return { ...base, kind: 'invoice', type: invoiceType, invoice: parseInvoice(object) }
  const type = oneOf(CHECKOUT_EVENTS, raw['type'])
  if (!type) return { ...base, kind: 'other', type: raw['type'] }
  return {
    ...base,
    kind: 'checkout',
    type,
    session: parseCheckoutSession(object),
  }
}
