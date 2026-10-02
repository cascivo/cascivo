<!--
  Generated from docs/ — do not edit here; run `pnpm regen`.
  Canonical: https://cascivo.com/docs/recipe-payments.md
  registry v1.5.0 · generated 2026-10-02
-->

# Recipe: payments, billing and email on Cloudflare

Take money and send mail from a cascivo app on Cloudflare Workers, with no Stripe SDK, no AWS
SDK and no `nodejs_compat`. Everything here is in `@cascivo/app`: plain `fetch` against
Stripe's and SES's APIs, and WebCrypto for the signatures.

| Subpath               | What it does                                                                                             |
| --------------------- | -------------------------------------------------------------------------------------------------------- |
| `@cascivo/app/stripe` | Checkout sessions, subscriptions, the Customer Portal, refunds, typed webhook events, entitlement checks |
| `@cascivo/app/guard`  | `verifyWebhook`: Stripe's signature and timestamp window over the raw body                               |
| `@cascivo/app/ses`    | Amazon SES sending, and SES bounces and complaints delivered by SNS                                      |
| `@cascivo/email`      | The emails themselves: receipts, reminders, newsletters                                                  |

The reference for every function is the
[`@cascivo/app` README](https://github.com/cascivo/cascivo/tree/main/packages/app#readme). This
page is the workflow, and the mistakes it is built to prevent.

## Start from a scaffold

```sh
npx cascivo create shop --framework cloudflare --example checkout              # one product
npx cascivo create shop --framework cloudflare --example checkout --auth email # + a monthly plan
npx cascivo create news --framework cloudflare --example newsletter            # Amazon SES
```

Each runs under `vite dev` before any account is set up: emails are logged instead of sent, and
the order page reads the payment back from Stripe instead of waiting for a webhook. The
generated README lists the keys and dashboard settings each one needs. The rest of this page
explains what the generated code does, so you can change it safely.

## Sell one thing

The Worker creates a Checkout Session and sends the browser to Stripe's hosted page. The card
never touches your app.

```ts
import { createStripe } from '@cascivo/app/stripe'

const stripe = createStripe(env.STRIPE_SECRET_KEY, { apiVersion: '2025-09-30.clover' })
const session = await stripe.createCheckoutSession(
  {
    mode: 'payment',
    lineItems: [{ name: 'Sticker pack', amount: 900, currency: 'eur', quantity: 1 }],
    successUrl: `${origin}/checkout/${orderId}`,
    cancelUrl: `${origin}/checkout`,
    clientReferenceId: orderId,
  },
  { idempotencyKey: orderId },
)
// store the order as pending under session.id, then redirect to session.url
```

- **The price comes from the Worker**, never from the browser.
- **The order id is the idempotency key**, so a retried request returns the first session
  instead of opening a second one.
- **Pin `apiVersion`**, so upgrading the Stripe account cannot change responses under a
  deployed app.

## Hear back from Stripe

Stripe calls your webhook when something happens. Verify first, then parse:

```ts
import { verifyWebhook } from '@cascivo/app/guard'
import { parseStripeEvent } from '@cascivo/app/stripe'

const { body, id } = await verifyWebhook(request, {
  scheme: 'stripe',
  secret: env.STRIPE_WEBHOOK_SECRET,
})
const event = parseStripeEvent(body)
```

`verifyWebhook` reads the raw body, checks the `Stripe-Signature` HMAC in constant time and
refuses a delivery signed more than five minutes ago (a captured one replayed later). A bad
signature is a 401. `id` is the event's `evt_…`: a retried delivery keeps it, so you can store
deliveries by it. `parseStripeEvent` then reads each field it types, because a signature proves
who sent the body, not its shape.

The handler has to survive three things Stripe does on purpose:

- **Retries.** An event can arrive twice, for up to three days. Change an order with an update
  conditioned on its current status (`… WHERE session_id = ? AND status = 'pending'`), so a
  second delivery changes nothing and the receipt goes out once.
- **Late and out-of-order events.** Never apply events in arrival order. Store what Stripe says
  now (`retrieveSubscription`), or keep a value that only grows (a refunded total).
- **Delayed payment methods.** `checkout.session.completed` with `paymentStatus: 'unpaid'` is a
  bank debit that has not settled. Fulfil on `checkout.session.async_payment_succeeded`.

Find the order by Stripe's session id, never by `clientReferenceId`: a buyer can set that one
on a Payment Link. Answer 2xx to events you do not handle (`kind: 'other'`) so Stripe stops
retrying them.

## After the sale: refunds and disputes

Refund and dispute events name the payment, not the session. Store
`session.paymentIntentId` with the order when it is paid, and look the order up by it.

| Event                    | `kind`    | What the order does                                                                 |
| ------------------------ | --------- | ----------------------------------------------------------------------------------- |
| `charge.refunded`        | `refund`  | Store `charge.amountRefunded`, the running total; `refunded` when `charge.refunded` |
| `charge.dispute.created` | `dispute` | `disputed`: hold back anything not delivered yet                                    |
| `charge.dispute.closed`  | `dispute` | `paid` again when `dispute.status` is `won`; stays `disputed` when `lost`           |

```ts
if (event.kind === 'refund') {
  // UPDATE orders SET refunded_amount = MAX(refunded_amount, ?) … WHERE payment_intent_id = ?
}
```

`amountRefunded` is cumulative, so keeping the largest value seen means a retried or late event
cannot count a refund twice. A `created` dispute event can arrive after the `closed` one: store
the dispute's status, and ignore `created` once a status is stored. Answer a dispute with
evidence in the Stripe dashboard, before the deadline it shows.

To refund from your own admin screen:

```ts
await stripe.createRefund({ paymentIntent, amount: 300 }, { idempotencyKey: `${orderId}-refund-1` })
```

Change the order when `charge.refunded` arrives, not on this call's answer. Then a refund made
in the Stripe dashboard is handled the same way.

## Subscriptions

A subscription needs an account to belong to, so this part assumes `--auth email`.

```ts
await stripe.createCheckoutSession({
  mode: 'subscription',
  lineItems: [{ name: 'Pro', amount: 900, currency: 'eur', interval: 'month', quantity: 1 }],
  successUrl: `${origin}/billing?session={CHECKOUT_SESSION_ID}`,
  cancelUrl: `${origin}/billing`,
  customerEmail: user.email, // or customer: the stored cus_… for a returning subscriber
  subscriptionMetadata: { user: user.id },
})
```

- **Name the user in `subscriptionMetadata`.** Only your server can set it, so every
  subscription event can be trusted to say whose plan it is.
- **Read the subscription back.** On `kind: 'subscription'`, call
  `retrieveSubscription(event.subscription.id)` and store that, not the event's copy.
- **Let Stripe host the rest.** `createPortalSession({ customer, returnUrl })` opens the
  Customer Portal for plan changes, cards, invoices and cancellation. Save its settings once in
  the dashboard (test mode too) first.

### Gate the paid features

```ts
import { isEntitled, requireEntitlement } from '@cascivo/app/stripe'

requireEntitlement(row?.status) // throws HttpError(402) unless the plan is on
```

`active` and `trialing` unlock the plan. `past_due` does too, while Stripe retries a failed
renewal: pass `{ pastDue: false }` to lock it at once instead. How long the retries last is set
in the Stripe dashboard (Billing → Subscriptions and emails → Manage failed payments), which
then ends the subscription as `canceled` or `unpaid`. So the grace period is decided in one
place, not in your code.

Check in the Worker, never only in the page. To show or hide things by plan, put the plan into
your feature flags' context, e.g.
`flags.evaluate(env.FLAGS, { plan: isEntitled(status) ? 'pro' : 'free' })`, and still refuse
the paid request in the Worker.

### Failed renewals

`invoice.payment_failed` (`kind: 'invoice'`) arrives once per failed attempt. Tell the customer,
with `invoice.hostedInvoiceUrl`: Stripe's page for paying the invoice with another card. Each
event can be retried, so record `${invoice.id}:${invoice.attemptCount}` and send only when it is
new. Send only to customers your app bills: one Stripe account often bills other things too.
If you send these yourself, turn off Stripe's own failed-payment emails, or customers get two.

## Email the customer

`sendEmail` from `@cascivo/email` checks a message before it leaves (subject, preheader, text
part, size, and line breaks in headers), then hands it to a sender. Cloudflare's Email Service
binding is a sender, and so is the SES client:

```tsx
import { createSes } from '@cascivo/app/ses'
import { Receipt, receiptSubject, renderEmail, sendEmail } from '@cascivo/email'

const message = renderEmail(<Receipt {...props} />, { subject: receiptSubject(props) })

await sendEmail(env.EMAIL, message, { from: 'shop@example.com', to }) // Email Service
await sendEmail(createSes({ region, accessKeyId, secretAccessKey }), message, {
  from: { name: 'Example Shop', email: 'shop@example.com' },
  to,
}) // Amazon SES
```

Pick the transport in one place. Email Service suits sign-in links and receipts on a domain
already on Cloudflare. Amazon SES suits bulk mail: about $0.10 per 1,000 emails, your own
domain with DKIM, and feedback about bounces and complaints. Give the SES IAM user
`ses:SendEmail` and nothing else.

### Bounces and complaints

SES publishes them to an SNS topic, which can call your Worker over HTTPS:

```ts
import { handleSns, parseSesNotification } from '@cascivo/app/ses'

return handleSns(request, {
  topicArn: env.SNS_TOPIC_ARN,
  onNotification: async ({ message }) => {
    const event = parseSesNotification(message)
    if (
      event.kind === 'complaint' ||
      (event.kind === 'bounce' && event.bounceType === 'Permanent')
    ) {
      // never mail event.recipients again
    }
  },
})
```

`handleSns` checks each message's RSA signature against the certificate SNS signs with,
fetched only from an `sns.<region>.amazonaws.com` host, and confirms the subscription itself.
Act on permanent bounces and complaints: an SES account that keeps mailing them is put under
review.

### Newsletters

Gmail and Yahoo filter bulk mail that skips the rules. `--example newsletter` has each one:
double opt-in, one-click unsubscribe (`List-Unsubscribe` and `List-Unsubscribe-Post`,
RFC 8058), suppression from SES feedback, and sending through a Queue at SES's rate, recording
each send so a retried batch never mails anyone twice.

## The Stripe webhook endpoint

In the Stripe dashboard, add an endpoint at `https://<your app>/api/stripe/webhook` for these
events, and put its signing secret in `STRIPE_WEBHOOK_SECRET`:

- `checkout.session.completed`, `checkout.session.async_payment_succeeded`,
  `checkout.session.async_payment_failed`, `checkout.session.expired`
- `charge.refunded`, `charge.dispute.created`, `charge.dispute.closed`
- with subscriptions: `customer.subscription.created`, `customer.subscription.updated`,
  `customer.subscription.deleted`, `invoice.payment_failed`

Locally, `stripe listen --forward-to localhost:5173/api/stripe/webhook` prints a webhook secret
for `.dev.vars`. In test mode, pay with the card `4242 4242 4242 4242`.

## What this does not cover

Stripe Elements (a card form in your page, with a larger PCI scope than hosted Checkout),
Connect, metered billing and Stripe Tax are product decisions rather than scaffolds. For any
other Stripe call, install the `stripe` package: it runs on Workers too, and nothing here gets
in its way. For any other AWS call, `signAwsRequest` from `@cascivo/app/ses` produces the
Signature V4 headers.
