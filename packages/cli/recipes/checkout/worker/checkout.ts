import { HttpError } from '@cascivo/app/api'
import { migrate, queryRows } from '@cascivo/app/db'
import type { Database } from '@cascivo/app/db'
import { verifyWebhook } from '@cascivo/app/guard'
import { StripeError, createStripe, parseStripeEvent } from '@cascivo/app/stripe'
import type {
  Charge,
  CheckoutEventType,
  CheckoutSession,
  Dispute,
  DisputeEventType,
  Invoice,
  Stripe,
} from '@cascivo/app/stripe'
import { writeRoom } from '@cascivo/app/sync-server'
import type { RoomNamespace } from '@cascivo/app/sync-server'
import { Receipt, receiptSubject, renderEmail } from '@cascivo/email'
import { createElement } from 'react'
import { ORDER_ID, PRODUCT, SHOP_NAME, formatPrice, orderRoom, parseOrder } from '../src/checkout'
import type { Order, OrderStatus } from '../src/checkout'

const migrations = [
  {
    id: '0001_orders',
    statements: [
      `CREATE TABLE orders (
        id TEXT PRIMARY KEY,
        session_id TEXT NOT NULL UNIQUE,
        status TEXT NOT NULL,
        amount INTEGER NOT NULL,
        currency TEXT NOT NULL,
        email TEXT,
        created_at TEXT NOT NULL,
        paid_at TEXT,
        payment_intent_id TEXT,
        refunded_amount INTEGER NOT NULL DEFAULT 0,
        dispute_status TEXT
      )`,
      // Refund and dispute events name the payment, not the session.
      'CREATE INDEX orders_payment_intent ON orders (payment_intent_id)',
    ],
  },
]

/** Where Stripe posts; add it as an endpoint in the Stripe dashboard (README). */
export const STRIPE_WEBHOOK_PATH = '/api/stripe/webhook'

/** What sending a receipt needs of the Email Service binding (`send_email`). */
export interface ReceiptSender {
  send(message: {
    from: string
    to: string
    subject: string
    text: string
    html: string
  }): Promise<unknown>
}

export interface CheckoutEnv {
  DB: Database
  ROOMS: RoomNamespace<unknown>
  EMAIL: ReceiptSender
  RECEIPT_FROM: string
  STRIPE_SECRET_KEY?: string
  STRIPE_WEBHOOK_SECRET?: string
}

const COLUMNS =
  'id, status, amount, currency, refunded_amount AS refundedAmount, created_at AS createdAt, paid_at AS paidAt'

export function stripeOf(env: { STRIPE_SECRET_KEY?: string }): Stripe {
  if (!env.STRIPE_SECRET_KEY) {
    throw new HttpError(
      503,
      'Set STRIPE_SECRET_KEY to a test key from the Stripe dashboard (README)',
    )
  }
  return createStripe(env.STRIPE_SECRET_KEY)
}

/** Stripe's refusal, for the page: its message in vite dev, a pointer to the log deployed. */
export function refused(error: unknown): never {
  if (!(error instanceof StripeError)) throw error
  console.error('[checkout] Stripe refused:', error.status, error.code, error.message)
  throw new HttpError(
    502,
    import.meta.env.DEV
      ? `Stripe: ${error.message}`
      : 'The payment provider refused the request (see the Worker log)',
  )
}

/**
 * Creates a Stripe Checkout Session for PRODUCT and records the order as pending. The order id
 * is also the idempotency key, so a retried request cannot open a second session.
 */
export async function startCheckout(env: CheckoutEnv, origin: string): Promise<{ url: string }> {
  const stripe = stripeOf(env)
  const id = crypto.randomUUID()
  let session: CheckoutSession
  try {
    session = await stripe.createCheckoutSession(
      {
        mode: 'payment',
        lineItems: [{ ...PRODUCT, quantity: 1 }],
        successUrl: `${origin}/checkout/${id}`,
        cancelUrl: `${origin}/checkout`,
        clientReferenceId: id,
      },
      { idempotencyKey: id },
    )
  } catch (error) {
    refused(error)
  }
  if (!session.url) throw new HttpError(502, 'Stripe returned no checkout page')
  await migrate(env.DB, migrations)
  await queryRows(
    env.DB,
    `INSERT INTO orders (id, session_id, status, amount, currency, created_at)
     VALUES (?, ?, 'pending', ?, ?, ?)`,
    [id, session.id, PRODUCT.amount, PRODUCT.currency, new Date().toISOString()],
    (row) => row,
  )
  return { url: session.url }
}

/** Where an event moves the order, or `null` when it does not move it. */
function statusAfter(type: CheckoutEventType, session: CheckoutSession): OrderStatus | null {
  switch (type) {
    case 'checkout.session.completed':
      // `unpaid` here is a bank debit that has not settled: the async events decide it.
      return session.paymentStatus === 'unpaid' ? null : 'paid'
    case 'checkout.session.async_payment_succeeded':
      return 'paid'
    case 'checkout.session.async_payment_failed':
      return 'failed'
    case 'checkout.session.expired':
      return 'expired'
  }
}

/** The same decision from a session read back from Stripe, with no event to go by. */
function statusOf(session: CheckoutSession): OrderStatus | null {
  if (session.status === 'complete' && session.paymentStatus !== 'unpaid') return 'paid'
  return session.status === 'expired' ? 'expired' : null
}

/**
 * Moves a pending order to its final status, once: a retried event, or the order page reading
 * the session before the webhook arrived, finds it settled and changes nothing. The order is
 * found by Stripe's session id, never by `client_reference_id`, which a buyer can set on a
 * Payment Link. Then the order's page hears about it, and a paid order gets its receipt.
 */
async function settle(
  env: CheckoutEnv,
  session: CheckoutSession,
  status: OrderStatus,
  origin: string,
): Promise<void> {
  await migrate(env.DB, migrations)
  const [order] = await queryRows(
    env.DB,
    `UPDATE orders SET status = ?, paid_at = ?, amount = COALESCE(?, amount),
       currency = COALESCE(?, currency), email = ?, payment_intent_id = ?
     WHERE session_id = ? AND status = 'pending' RETURNING ${COLUMNS}`,
    [
      status,
      status === 'paid' ? new Date().toISOString() : null,
      session.amountTotal,
      session.currency,
      session.customerEmail,
      session.paymentIntentId,
      session.id,
    ],
    parseOrder,
  )
  if (!order) return
  await writeRoom(env.ROOMS, orderRoom(order.id), 'order', { ...order })
  if (order.status === 'paid' && session.customerEmail) {
    await sendReceipt(env, order, session.customerEmail, origin)
  }
}

/**
 * Emails a receipt rendered with @cascivo/email. `vite dev` renders it and logs it instead.
 * A receipt that cannot be sent is logged, not thrown: the payment is recorded either way, and
 * Stripe retrying the event would not send it again.
 */
async function sendReceipt(env: CheckoutEnv, order: Order, to: string, origin: string) {
  const total = formatPrice(order.amount, order.currency)
  const props = {
    productName: SHOP_NAME,
    orderId: order.id.slice(0, 8).toUpperCase(),
    items: [{ description: PRODUCT.name, amount: total }],
    total,
    invoiceHref: `${origin}/checkout/${order.id}`,
  }
  const message = renderEmail(createElement(Receipt, props), { subject: receiptSubject(props) })
  if (import.meta.env.DEV) {
    console.log(`[checkout] receipt for ${to}: "${message.subject}" (${message.html.length} bytes)`)
    return
  }
  if (!env.RECEIPT_FROM) {
    console.warn('[checkout] no receipt sent: set RECEIPT_FROM in wrangler.jsonc')
    return
  }
  try {
    await env.EMAIL.send({
      from: env.RECEIPT_FROM,
      to,
      subject: message.subject,
      text: message.text,
      html: message.html,
    })
  } catch (error) {
    console.error('[checkout] receipt not sent:', error)
  }
}

/**
 * A refund, made in the Stripe dashboard or with `createRefund`. `charge.refunded` carries the
 * running total, so a retried or late event cannot count a refund twice. All of it refunded
 * makes the order `refunded`; part of it leaves it `paid`, with the amount shown.
 */
async function refundOrder(env: CheckoutEnv, charge: Charge): Promise<void> {
  if (!charge.paymentIntentId) return
  await migrate(env.DB, migrations)
  const [order] = await queryRows(
    env.DB,
    `UPDATE orders SET refunded_amount = MAX(refunded_amount, ?),
       status = CASE WHEN ? = 1 THEN 'refunded' ELSE status END
     WHERE payment_intent_id = ? AND status IN ('paid', 'refunded') RETURNING ${COLUMNS}`,
    [charge.amountRefunded, charge.refunded ? 1 : 0, charge.paymentIntentId],
    parseOrder,
  )
  if (order) await writeRoom(env.ROOMS, orderRoom(order.id), 'order', { ...order })
}

/**
 * A chargeback. While it is open the order is `disputed`: hold back anything not yet
 * delivered, and answer it with evidence in the Stripe dashboard before the deadline shown
 * there. Won, the order is `paid` again; lost, it stays `disputed`. The dispute's status is
 * stored, so a `created` event arriving after `closed` cannot reopen it.
 */
async function disputeOrder(
  env: CheckoutEnv,
  type: DisputeEventType,
  dispute: Dispute,
): Promise<void> {
  if (!dispute.paymentIntentId) return
  await migrate(env.DB, migrations)
  const [order] =
    type === 'charge.dispute.created'
      ? await queryRows(
          env.DB,
          `UPDATE orders SET status = 'disputed', dispute_status = ?
           WHERE payment_intent_id = ? AND status = 'paid' AND dispute_status IS NULL
           RETURNING ${COLUMNS}`,
          [dispute.status, dispute.paymentIntentId],
          parseOrder,
        )
      : await queryRows(
          env.DB,
          `UPDATE orders SET dispute_status = ?,
             status = CASE WHEN ? = 'won' THEN 'paid' ELSE 'disputed' END
           WHERE payment_intent_id = ? AND status IN ('paid', 'disputed') RETURNING ${COLUMNS}`,
          [dispute.status, dispute.status, dispute.paymentIntentId],
          parseOrder,
        )
  if (!order) return
  if (type === 'charge.dispute.created') {
    console.warn(
      `[checkout] order ${order.id} is disputed (${dispute.reason ?? 'no reason given'})`,
    )
  }
  await writeRoom(env.ROOMS, orderRoom(order.id), 'order', { ...order })
}

/** What the webhook hands to worker/billing.ts, when the app bills subscriptions. */
export interface BillingHooks {
  /** A subscription changed: store its current state. */
  subscription(subscriptionId: string): Promise<void>
  /** A renewal could not be charged: tell the customer. */
  paymentFailed(invoice: Invoice, origin: string): Promise<void>
}

/**
 * Stripe's webhook: verified against STRIPE_WEBHOOK_SECRET before anything in it is read,
 * then each Checkout event settles its order, and refunds and disputes update it. Subscription
 * and invoice events, and completed subscription checkouts, go to `billing` when the app bills
 * subscriptions (worker/billing.ts). Other events are acknowledged, so Stripe stops sending them.
 */
export async function receiveStripe(
  request: Request,
  env: CheckoutEnv,
  billing?: BillingHooks,
): Promise<Response> {
  if (!env.STRIPE_WEBHOOK_SECRET) throw new HttpError(503, 'Set STRIPE_WEBHOOK_SECRET (README)')
  const { body } = await verifyWebhook(request, {
    scheme: 'stripe',
    secret: env.STRIPE_WEBHOOK_SECRET,
  })
  const event = parseStripeEvent(body)
  const origin = new URL(request.url).origin
  if (event.kind === 'subscription') await billing?.subscription(event.subscription.id)
  if (event.kind === 'invoice' && event.type === 'invoice.payment_failed') {
    await billing?.paymentFailed(event.invoice, origin)
  }
  if (event.kind === 'refund') await refundOrder(env, event.charge)
  if (event.kind === 'dispute') await disputeOrder(env, event.type, event.dispute)
  if (event.kind === 'checkout' && event.session.mode === 'subscription') {
    if (event.session.subscriptionId) await billing?.subscription(event.session.subscriptionId)
  } else if (event.kind === 'checkout') {
    const status = statusAfter(event.type, event.session)
    if (status) await settle(env, event.session, status, origin)
  }
  return Response.json({ received: true })
}

function parseStored(raw: unknown): { order: Order; sessionId: string } {
  const sessionId = typeof raw === 'object' && raw !== null ? Reflect.get(raw, 'sessionId') : null
  if (typeof sessionId !== 'string') throw new Error('Malformed order row')
  return { order: parseOrder(raw), sessionId }
}

async function readOrder(env: CheckoutEnv, id: string) {
  await migrate(env.DB, migrations)
  const [row] = await queryRows(
    env.DB,
    `SELECT ${COLUMNS}, session_id AS sessionId FROM orders WHERE id = ?`,
    [id],
    parseStored,
  )
  if (!row) throw new HttpError(404, 'No such order')
  return row
}

/**
 * An order, for its page. A pending one is checked with Stripe first, so the page is right
 * even when the webhook is late or not set up yet (as in `vite dev` without `stripe listen`).
 */
export async function getOrder(env: CheckoutEnv, id: string, origin: string): Promise<Order> {
  if (!ORDER_ID.test(id)) throw new HttpError(404, 'No such order')
  const { order, sessionId } = await readOrder(env, id)
  if (order.status !== 'pending' || !env.STRIPE_SECRET_KEY) return order
  try {
    const session = await stripeOf(env).retrieveCheckoutSession(sessionId)
    const status = statusOf(session)
    if (!status) return order
    await settle(env, session, status, origin)
  } catch (error) {
    // Stripe unreachable: show what is known; the webhook settles the order later.
    console.error('[checkout] could not read the session back:', error)
    return order
  }
  return (await readOrder(env, id)).order
}
