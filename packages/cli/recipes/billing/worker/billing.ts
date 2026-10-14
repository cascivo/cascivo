import { HttpError } from '@cascivo/app/api'
import { requireUser } from '@cascivo/app/auth-server'
import { migrate, queryRows } from '@cascivo/app/db'
import type { Database } from '@cascivo/app/db'
import { isEntitled, requireEntitlement } from '@cascivo/app/stripe'
import type { Invoice, Subscription } from '@cascivo/app/stripe'
import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Section,
  Text,
  renderEmail,
} from '@cascivo/email'
import { createElement as h } from 'react'
import { PLAN, parseBilling } from '../src/billing'
import type { Billing } from '../src/billing'
import { SHOP_NAME, formatPrice } from '../src/checkout'
import { refused, stripeOf } from './checkout'
import type { BillingHooks, ReceiptSender } from './checkout'

const migrations = [
  {
    id: '0001_billing',
    statements: [
      `CREATE TABLE billing (
        user_id TEXT PRIMARY KEY,
        customer_id TEXT,
        subscription_id TEXT,
        status TEXT NOT NULL,
        current_period_end INTEGER,
        cancel_at_period_end INTEGER NOT NULL DEFAULT 0,
        updated_at TEXT NOT NULL,
        reminded TEXT
      )`,
    ],
  },
]

export interface BillingEnv {
  DB: Database
  EMAIL: ReceiptSender
  RECEIPT_FROM: string
  STRIPE_SECRET_KEY?: string
}

interface Row {
  status: string
  customerId: string | null
  currentPeriodEnd: number | null
  cancelAtPeriodEnd: number
}

const cell = (raw: unknown, key: string): unknown =>
  typeof raw === 'object' && raw !== null ? Reflect.get(raw, key) : undefined

function parseRow(raw: unknown): Row {
  const status = cell(raw, 'status')
  const customerId = cell(raw, 'customerId')
  const end = cell(raw, 'currentPeriodEnd')
  if (typeof status !== 'string') throw new Error('Malformed billing row')
  return {
    status,
    customerId: typeof customerId === 'string' ? customerId : null,
    currentPeriodEnd: typeof end === 'number' ? end : null,
    cancelAtPeriodEnd: Number(cell(raw, 'cancelAtPeriodEnd')),
  }
}

async function readRow(db: Database, userId: string): Promise<Row | null> {
  await migrate(db, migrations)
  const [row] = await queryRows(
    db,
    `SELECT status, customer_id AS customerId, current_period_end AS currentPeriodEnd,
       cancel_at_period_end AS cancelAtPeriodEnd FROM billing WHERE user_id = ?`,
    [userId],
    parseRow,
  )
  return row ?? null
}

/** A stored row as the page sees it; the status is checked against the known ones. */
function toBilling(row: Row | null): Billing {
  const billing = parseBilling({
    status: row?.status ?? 'none',
    active: false,
    currentPeriodEnd:
      row?.currentPeriodEnd != null ? new Date(row.currentPeriodEnd * 1000).toISOString() : null,
    cancelAtPeriodEnd: row?.cancelAtPeriodEnd === 1,
    canManage: row?.customerId != null,
  })
  return { ...billing, active: isEntitled(billing.status) }
}

/**
 * Stores a subscription's current state for the user its metadata names. The metadata is set
 * by startSubscription, server side: a subscription made any other way (a Payment Link, the
 * dashboard) names no user here and is ignored. A different subscription replaces the stored
 * one only when that one is over, so a late event about an old plan cannot end a new one.
 */
async function store(db: Database, subscription: Subscription): Promise<void> {
  const userId = subscription.metadata['user']
  if (!userId) return
  await migrate(db, migrations)
  await queryRows(
    db,
    `INSERT INTO billing
       (user_id, customer_id, subscription_id, status, current_period_end, cancel_at_period_end, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT (user_id) DO UPDATE SET
       customer_id = excluded.customer_id, subscription_id = excluded.subscription_id,
       status = excluded.status, current_period_end = excluded.current_period_end,
       cancel_at_period_end = excluded.cancel_at_period_end, updated_at = excluded.updated_at
     WHERE billing.subscription_id IS excluded.subscription_id
       OR billing.status NOT IN ('active', 'trialing', 'past_due')
     RETURNING user_id`,
    [
      userId,
      subscription.customerId,
      subscription.id,
      subscription.status,
      subscription.currentPeriodEnd,
      subscription.cancelAtPeriodEnd ? 1 : 0,
      new Date().toISOString(),
    ],
    (raw) => raw,
  )
}

/**
 * The webhook's part (worker/checkout.ts passes subscription events here). The event's copy
 * may be stale, since events arrive out of order: the subscription is read back from Stripe.
 */
export async function syncSubscription(env: BillingEnv, subscriptionId: string): Promise<void> {
  await store(env.DB, await stripeOf(env).retrieveSubscription(subscriptionId))
}

/** The signed-in user's plan. */
export async function getBilling(env: BillingEnv, request: Request): Promise<Billing> {
  const user = await requireUser(env.DB, request)
  return toBilling(await readRow(env.DB, user.id))
}

/**
 * Refuses a user whose plan is not on: 401 signed out, 402 without the plan. Call it in the
 * Worker before serving a paid feature, never trusting what the page shows.
 */
export async function requirePlan(env: BillingEnv, request: Request): Promise<void> {
  const user = await requireUser(env.DB, request)
  requireEntitlement((await readRow(env.DB, user.id))?.status)
}

/** The email for a renewal that could not be charged, with where to pay it. */
function renderPaymentFailed(invoice: Invoice, payHref: string) {
  const subject = `Your ${PLAN.name} payment did not go through`
  const amount = formatPrice(invoice.amountDue, invoice.currency)
  return renderEmail(
    h(
      Html,
      null,
      h(Head, { title: subject }),
      h(
        Body,
        null,
        h(Preview, null, `We could not charge ${amount}. Update your card to keep ${PLAN.name}.`),
        h(
          Container,
          null,
          h(
            Section,
            { padding: 32 },
            h(Heading, { level: 1 }, 'Your payment did not go through'),
            h(
              Text,
              null,
              `We could not charge ${amount} for ${SHOP_NAME} ${PLAN.name}. Your plan stays on while we try again; pay with another card to keep it.`,
            ),
            h(Button, { href: payHref }, 'Update payment'),
          ),
        ),
      ),
    ),
    { subject },
  )
}

/**
 * A renewal Stripe could not charge (`invoice.payment_failed`). The customer hears about it
 * once per attempt, with Stripe's page for paying the invoice with another card. The plan stays
 * on while Stripe retries (`past_due`); the Stripe dashboard's failed-payment settings decide
 * when it ends. Only customers this app bills are written to: a retried event, or an invoice
 * for something else on the same Stripe account, sends nothing.
 */
export async function remindPayment(
  env: BillingEnv,
  invoice: Invoice,
  origin: string,
): Promise<void> {
  if (!invoice.customerId || !invoice.customerEmail) return
  await migrate(env.DB, migrations)
  const attempt = `${invoice.id}:${invoice.attemptCount}`
  const [row] = await queryRows(
    env.DB,
    'UPDATE billing SET reminded = ? WHERE customer_id = ? AND reminded IS NOT ? RETURNING user_id',
    [attempt, invoice.customerId, attempt],
    (raw) => raw,
  )
  if (!row) return
  const message = renderPaymentFailed(invoice, invoice.hostedInvoiceUrl ?? `${origin}/billing`)
  if (import.meta.env.DEV) {
    console.log(`[billing] payment reminder for ${invoice.customerEmail}: "${message.subject}"`)
    return
  }
  if (!env.RECEIPT_FROM) {
    console.warn('[billing] no payment reminder sent: set RECEIPT_FROM in wrangler.jsonc')
    return
  }
  try {
    await env.EMAIL.send({
      from: env.RECEIPT_FROM,
      to: invoice.customerEmail,
      subject: message.subject,
      text: message.text,
      html: message.html,
    })
  } catch (error) {
    // Logged, not thrown: Stripe retrying the event would not send it again.
    console.error('[billing] payment reminder not sent:', error)
  }
}

/** What the Stripe webhook (worker/checkout.ts) hands over to billing. */
export function billingHooks(env: BillingEnv): BillingHooks {
  return {
    subscription: (id) => syncSubscription(env, id),
    paymentFailed: (invoice, origin) => remindPayment(env, invoice, origin),
  }
}

/** Opens a subscription checkout for PLAN, naming the user in the subscription's metadata. */
export async function startSubscription(
  env: BillingEnv,
  request: Request,
  origin: string,
): Promise<{ url: string }> {
  const user = await requireUser(env.DB, request)
  const row = await readRow(env.DB, user.id)
  if (row && toBilling(row).active) {
    throw new HttpError(409, 'You already have the plan. Manage it in the billing portal.')
  }
  const stripe = stripeOf(env)
  try {
    const session = await stripe.createCheckoutSession({
      mode: 'subscription',
      lineItems: [{ ...PLAN, quantity: 1 }],
      // Stripe fills in {CHECKOUT_SESSION_ID}, so the page can sync before any webhook.
      successUrl: `${origin}/billing?session={CHECKOUT_SESSION_ID}`,
      cancelUrl: `${origin}/billing`,
      // Signed in with a provider that shares no email: Stripe's checkout asks for one.
      ...(row?.customerId
        ? { customer: row.customerId }
        : user.email
          ? { customerEmail: user.email }
          : {}),
      clientReferenceId: user.id,
      subscriptionMetadata: { user: user.id },
    })
    if (!session.url) throw new HttpError(502, 'Stripe returned no checkout page')
    return { url: session.url }
  } catch (error) {
    if (error instanceof HttpError) throw error
    refused(error)
  }
}

/**
 * Back from Stripe's checkout: reads the session and its subscription, so the page is right
 * before the webhook arrives (or in `vite dev` without `stripe listen`). Only the user the
 * subscription names can sync it.
 */
export async function syncBilling(
  env: BillingEnv,
  request: Request,
  sessionId: string,
): Promise<Billing> {
  const user = await requireUser(env.DB, request)
  const stripe = stripeOf(env)
  try {
    const session = await stripe.retrieveCheckoutSession(sessionId)
    if (session.mode === 'subscription' && session.subscriptionId) {
      const subscription = await stripe.retrieveSubscription(session.subscriptionId)
      if (subscription.metadata['user'] !== user.id) {
        throw new HttpError(403, 'This checkout belongs to another account')
      }
      await store(env.DB, subscription)
    }
  } catch (error) {
    if (error instanceof HttpError) throw error
    refused(error)
  }
  return toBilling(await readRow(env.DB, user.id))
}

/** Opens Stripe's Customer Portal: plan, card, invoices and cancellation, all hosted. */
export async function openPortal(
  env: BillingEnv,
  request: Request,
  origin: string,
): Promise<{ url: string }> {
  const user = await requireUser(env.DB, request)
  const row = await readRow(env.DB, user.id)
  if (!row?.customerId) throw new HttpError(409, 'Subscribe first: there is nothing to manage yet')
  try {
    return await stripeOf(env).createPortalSession({
      customer: row.customerId,
      returnUrl: `${origin}/billing`,
    })
  } catch (error) {
    refused(error)
  }
}
