// @vitest-environment node
import { describe, expect, it } from 'vitest'
import { verifyWebhook } from './guard'
import {
  StripeError,
  createStripe,
  parseCheckoutSession,
  parseStripeEvent,
  parseSubscription,
} from './stripe'

/** A Checkout Session as Stripe's API returns it, trimmed to what matters here. */
const session = (overrides: Record<string, unknown> = {}) => ({
  id: 'cs_test_a1',
  object: 'checkout.session',
  mode: 'payment',
  url: 'https://checkout.stripe.com/c/pay/cs_test_a1',
  status: 'open',
  payment_status: 'unpaid',
  amount_total: 900,
  currency: 'eur',
  customer_details: null,
  customer_email: null,
  client_reference_id: 'order-1',
  metadata: { order: 'order-1' },
  livemode: false,
  ...overrides,
})

/** A `fetch` that records each request and answers with `reply`. */
function stubFetch(reply: () => Response) {
  const calls: { url: string; init: RequestInit }[] = []
  const fetch = (async (input: RequestInfo | URL, init: RequestInit = {}) => {
    calls.push({ url: String(input), init })
    return reply()
  }) as typeof globalThis.fetch
  return { calls, fetch }
}

describe('createStripe', () => {
  it('creates a Checkout Session with Stripe’s form encoding and an idempotency key', async () => {
    const { calls, fetch } = stubFetch(() => Response.json(session()))
    const stripe = createStripe('sk_test_123', { fetch, apiVersion: '2025-09-30.clover' })
    const created = await stripe.createCheckoutSession(
      {
        mode: 'payment',
        lineItems: [
          {
            name: 'Sticker pack',
            description: 'Twelve stickers',
            amount: 900,
            currency: 'eur',
            quantity: 2,
          },
          { price: 'price_123', quantity: 1 },
        ],
        successUrl: 'https://app.example/thanks?order=order-1',
        cancelUrl: 'https://app.example/shop',
        clientReferenceId: 'order-1',
        metadata: { order: 'order-1' },
      },
      { idempotencyKey: 'order-1' },
    )
    expect(created.url).toBe('https://checkout.stripe.com/c/pay/cs_test_a1')

    const [call] = calls
    expect(call!.url).toBe('https://api.stripe.com/v1/checkout/sessions')
    expect(call!.init.method).toBe('POST')
    expect(call!.init.headers).toEqual({
      authorization: 'Bearer sk_test_123',
      'content-type': 'application/x-www-form-urlencoded',
      'stripe-version': '2025-09-30.clover',
      'idempotency-key': 'order-1',
    })
    const form = Object.fromEntries(new URLSearchParams(String(call!.init.body)))
    expect(form).toEqual({
      mode: 'payment',
      success_url: 'https://app.example/thanks?order=order-1',
      cancel_url: 'https://app.example/shop',
      client_reference_id: 'order-1',
      'metadata[order]': 'order-1',
      'line_items[0][quantity]': '2',
      'line_items[0][price_data][currency]': 'eur',
      'line_items[0][price_data][unit_amount]': '900',
      'line_items[0][price_data][product_data][name]': 'Sticker pack',
      'line_items[0][price_data][product_data][description]': 'Twelve stickers',
      'line_items[1][quantity]': '1',
      'line_items[1][price]': 'price_123',
    })
  })

  it('reads a session back by id, escaped into the path, with no body', async () => {
    const paid = session({
      status: 'complete',
      payment_status: 'paid',
      customer_details: { email: 'buyer@example.com' },
    })
    const { calls, fetch } = stubFetch(() => Response.json(paid))
    const read = await createStripe('sk_test_123', { fetch }).retrieveCheckoutSession('cs_test/a1')
    expect(calls[0]!.url).toBe('https://api.stripe.com/v1/checkout/sessions/cs_test%2Fa1')
    expect(calls[0]!.init.method).toBe('GET')
    expect(calls[0]!.init.body).toBeUndefined()
    expect(read).toMatchObject({
      status: 'complete',
      paymentStatus: 'paid',
      customerEmail: 'buyer@example.com',
    })
  })

  it('throws Stripe’s own error, with its status, type and code', async () => {
    const { fetch } = stubFetch(() =>
      Response.json(
        { error: { message: 'Invalid API Key provided', type: 'invalid_request_error' } },
        { status: 401 },
      ),
    )
    const error = await createStripe('sk_test_bad', { fetch })
      .retrieveCheckoutSession('cs_1')
      .catch((e: unknown) => e)
    expect(error).toBeInstanceOf(StripeError)
    expect(error).toMatchObject({
      status: 401,
      message: 'Invalid API Key provided',
      type: 'invalid_request_error',
      code: null,
    })
  })

  it('says what failed when the error is not JSON', async () => {
    const { fetch } = stubFetch(() => new Response('upstream down', { status: 502 }))
    await expect(
      createStripe('sk_test_123', { fetch }).retrieveCheckoutSession('cs_1'),
    ).rejects.toThrow('Stripe answered 502')
  })

  it('refuses to start without a key, so an unset secret fails loudly', () => {
    expect(() => createStripe('')).toThrow(/no secret key/)
  })
})

/** A subscription as Stripe's API returns it, trimmed. */
const subscription = (overrides: Record<string, unknown> = {}) => ({
  id: 'sub_1',
  object: 'subscription',
  status: 'active',
  customer: 'cus_1',
  cancel_at_period_end: false,
  items: { data: [{ price: { id: 'price_pro' }, current_period_end: 1800000000 }] },
  metadata: { user: 'u-1' },
  livemode: false,
  ...overrides,
})

describe('subscriptions', () => {
  it('opens a subscription checkout with a recurring price and server-set metadata', async () => {
    const { calls, fetch } = stubFetch(() =>
      Response.json(session({ mode: 'subscription', customer: 'cus_1', subscription: null })),
    )
    await createStripe('sk_test_123', { fetch }).createCheckoutSession({
      mode: 'subscription',
      lineItems: [{ name: 'Pro', amount: 900, currency: 'eur', quantity: 1, interval: 'month' }],
      successUrl: 'https://app.example/billing',
      cancelUrl: 'https://app.example/billing',
      customer: 'cus_1',
      subscriptionMetadata: { user: 'u-1' },
    })
    const form = Object.fromEntries(new URLSearchParams(String(calls[0]!.init.body)))
    expect(form).toMatchObject({
      mode: 'subscription',
      customer: 'cus_1',
      'subscription_data[metadata][user]': 'u-1',
      'line_items[0][price_data][recurring][interval]': 'month',
    })
  })

  it('reads a subscription, with its period on the subscription or on its items', async () => {
    const { calls, fetch } = stubFetch(() => Response.json(subscription()))
    const read = await createStripe('sk_test_123', { fetch }).retrieveSubscription('sub_1')
    expect(calls[0]!.url).toBe('https://api.stripe.com/v1/subscriptions/sub_1')
    expect(read).toEqual({
      id: 'sub_1',
      status: 'active',
      customerId: 'cus_1',
      currentPeriodEnd: 1800000000,
      cancelAtPeriodEnd: false,
      priceId: 'price_pro',
      metadata: { user: 'u-1' },
      livemode: false,
    })
    // Older API versions: the period on the subscription, the customer expanded.
    expect(
      parseSubscription(
        subscription({
          current_period_end: 1700000000,
          customer: { id: 'cus_2', object: 'customer' },
        }),
      ),
    ).toMatchObject({ currentPeriodEnd: 1700000000, customerId: 'cus_2' })
    expect(() => parseSubscription(subscription({ status: 'mystery' }))).toThrow(/unknown status/)
    expect(() => parseSubscription(subscription({ customer: null }))).toThrow(/no customer/)
  })

  it('opens the Customer Portal for a customer', async () => {
    const { calls, fetch } = stubFetch(() =>
      Response.json({ object: 'billing_portal.session', url: 'https://billing.stripe.com/p/1' }),
    )
    const portal = await createStripe('sk_test_123', { fetch }).createPortalSession({
      customer: 'cus_1',
      returnUrl: 'https://app.example/billing',
    })
    expect(portal).toEqual({ url: 'https://billing.stripe.com/p/1' })
    expect(calls[0]!.url).toBe('https://api.stripe.com/v1/billing_portal/sessions')
    expect(Object.fromEntries(new URLSearchParams(String(calls[0]!.init.body)))).toEqual({
      customer: 'cus_1',
      return_url: 'https://app.example/billing',
    })
  })

  it('types subscription events, with the subscription and the session’s ids', () => {
    const body = JSON.stringify({
      id: 'evt_2',
      object: 'event',
      type: 'customer.subscription.deleted',
      created: 1700000000,
      data: { object: subscription({ status: 'canceled' }) },
    })
    expect(parseStripeEvent(body)).toMatchObject({
      kind: 'subscription',
      type: 'customer.subscription.deleted',
      subscription: { status: 'canceled', metadata: { user: 'u-1' } },
    })
    expect(
      parseCheckoutSession(
        session({ mode: 'subscription', customer: 'cus_1', subscription: { id: 'sub_1' } }),
      ),
    ).toMatchObject({ mode: 'subscription', customerId: 'cus_1', subscriptionId: 'sub_1' })
  })
})

describe('parseCheckoutSession', () => {
  it('prefers the email typed on Stripe’s page, then the one passed in', () => {
    expect(parseCheckoutSession(session({ customer_email: 'given@example.com' }))).toMatchObject({
      customerEmail: 'given@example.com',
    })
    expect(
      parseCheckoutSession(
        session({ customer_email: 'given@example.com', customer_details: { email: 'typed@x.io' } }),
      ).customerEmail,
    ).toBe('typed@x.io')
  })

  it('keeps only string metadata, and nulls what is missing', () => {
    const parsed = parseCheckoutSession(
      session({ metadata: { order: 'o', count: 3 }, amount_total: undefined, url: null }),
    )
    expect(parsed).toMatchObject({ metadata: { order: 'o' }, amountTotal: null, url: null })
  })

  it('refuses anything that is not a session, or a status it does not know', () => {
    expect(() => parseCheckoutSession(null)).toThrow(/Checkout Session/)
    expect(() => parseCheckoutSession({ ...session(), object: 'payment_intent' })).toThrow()
    expect(() => parseCheckoutSession(session({ status: 'pending' }))).toThrow(/unknown status/)
    expect(() => parseCheckoutSession(session({ payment_status: 'maybe' }))).toThrow()
  })
})

describe('parseStripeEvent', () => {
  const event = (type: string, object: unknown = session()) =>
    JSON.stringify({ id: 'evt_1', object: 'event', type, created: 1700000000, data: { object } })

  it('types the Checkout events, with their session', () => {
    const parsed = parseStripeEvent(
      event('checkout.session.completed', session({ status: 'complete', payment_status: 'paid' })),
    )
    expect(parsed).toMatchObject({
      kind: 'checkout',
      id: 'evt_1',
      type: 'checkout.session.completed',
      created: 1700000000,
      livemode: false,
    })
    if (parsed.kind !== 'checkout') throw new Error('unreachable')
    expect(parsed.session.paymentStatus).toBe('paid')
  })

  it('passes other events through as `other`, so they can be acknowledged', () => {
    expect(parseStripeEvent(event('invoice.paid', { object: 'invoice' }))).toEqual({
      kind: 'other',
      id: 'evt_1',
      type: 'invoice.paid',
      created: 1700000000,
      livemode: false,
    })
  })

  it('refuses a body that is not an event, or a Checkout event without a session', () => {
    expect(() => parseStripeEvent('not json')).toThrow(/JSON/)
    expect(() => parseStripeEvent(JSON.stringify({ id: 'evt_1', type: 'x' }))).toThrow(/event/)
    expect(() => parseStripeEvent(event('checkout.session.expired', null))).toThrow(/Session/)
  })

  it('reads what verifyWebhook returns from a signed delivery', async () => {
    const body = event('checkout.session.expired', session({ status: 'expired' }))
    const t = Math.floor(Date.now() / 1000)
    const key = await crypto.subtle.importKey(
      'raw',
      new TextEncoder().encode('whsec_test'),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign'],
    )
    const mac = new Uint8Array(
      await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(`${t}.${body}`)),
    )
    const hex = Array.from(mac, (b) => b.toString(16).padStart(2, '0')).join('')
    const request = new Request('https://app.example/api/stripe/webhook', {
      method: 'POST',
      headers: { 'stripe-signature': `t=${t},v1=${hex}` },
      body,
    })
    const verified = await verifyWebhook(request, { scheme: 'stripe', secret: 'whsec_test' })
    expect(parseStripeEvent(verified.body)).toMatchObject({
      kind: 'checkout',
      type: 'checkout.session.expired',
    })
  })
})
