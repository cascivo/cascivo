# Stripe and Amazon SES on the Cloudflare scaffold

Date: 2026-10-01. Follow-up to [#257](https://github.com/cascivo/cascivo/pull/257) (Stage). Question: should the Cloudflare app layer
(`@cascivo/app` plus `cascivo create --framework cloudflare`) get the same kind of integration
for Stripe (taking money) and AWS (sending email cheaply, newsletters included), and what would
it take for both to run on Workers?

Short answer: yes for both, with one correction. **Sending is Amazon SES, not SNS.** SNS has a
role too, but as the channel that tells the Worker about bounces and complaints.

## What already exists

A good part of the plumbing is already there, so this is smaller than it looks.

| Need                                 | Already in the repo                                                          |
| ------------------------------------ | ---------------------------------------------------------------------------- |
| Verify a Stripe webhook              | `verifyWebhook(request, { scheme: 'stripe', secret })` in `@cascivo/app/guard`: `Stripe-Signature`, timestamp window, secret rotation, WebCrypto HMAC |
| Store each event once                | `@cascivo/app/db` (D1 + migrations); the `webhooks` example stores by delivery id |
| Push "payment done" to the open page | `writeRoom` in `@cascivo/app/sync-server`; the `webhooks` example pushes each delivery live |
| Accounts to attach a purchase to     | `--auth email` (`@cascivo/app/auth-server`, magic links in D1)               |
| Render the email                     | `@cascivo/email`: `renderEmail`, `assertSendable`, `Receipt`, `Welcome`, `PasswordReset` templates, text part and preheader included |
| Send an email                        | Cloudflare Email Service binding (`send_email`), used by `--auth email` and `--example digest` |
| Run work later / in bulk             | Queues (`--example live`), Workflows (`--example import`), Cron (`--example digest`) |

What is missing is the outbound side: calling Stripe's API, calling SES's API (which needs AWS
SigV4 signing), and verifying SNS's messages (which are signed with RSA and an X.509
certificate, not an HMAC).

## Stripe

### Use cases worth shipping

The test for each: an adopter with an idea for something to sell can go from `cascivo create`
to a working, deployed checkout without writing payment code.

1. **Sell one thing (one-off payment).** A product page with a Buy button. The Worker creates a
   Stripe Checkout Session and redirects to Stripe's hosted page. Stripe calls the Worker's
   webhook, which records the order in D1, sends a receipt with `@cascivo/email`'s `Receipt`,
   and pushes "paid" to the success page through a room. This covers digital downloads, event
   tickets, donations and pre-orders. **Highest value, lowest risk.**
2. **Subscriptions (SaaS).** Same flow with `mode: 'subscription'`, tied to a `--auth email`
   user. The webhook keeps an `entitlements` row per user current; the app reads it to unlock
   features. A "Manage billing" button opens Stripe's hosted Customer Portal, so plan changes,
   card updates and cancellation need no UI from us.
3. **Payment Links (no code).** Worth one paragraph in the docs, not a feature: a link made in
   the Stripe dashboard plus the same webhook handler covers a lot of "I just want to sell this".

Not worth shipping in a starter pack: a custom card form with Stripe Elements (larger PCI scope
than hosted Checkout, for little gain), Connect / marketplaces, metered billing, Stripe Tax set-up.
Each is real, but each is a product decision, not a scaffold.

### Webhooks on a Worker: what the handler must get right

The signature check exists; the rest is what usually goes wrong:

- **Verify the raw body before parsing.** `verifyWebhook` already reads `request.text()` and
  checks it. Nothing else may read the body first.
- **Handle each event once.** Stripe retries for up to three days and can deliver an event
  twice. Store by the event `id` (in the body for Stripe; `verifyWebhook` returns `id: null`
  for this scheme, so either parse it from the body or teach `verifyWebhook` to return it).
- **Do not trust event order.** For subscriptions, re-read the object from the API (or compare
  `created`) instead of applying events in arrival order.
- **Answer 2xx fast.** Record the event, then do the slow work (email, fulfilment) in
  `ctx.waitUntil` or on a Queue, so a slow email provider does not cause Stripe retries.
- **Delayed payment methods.** `checkout.session.completed` with `payment_status: 'unpaid'`
  (SEPA, bank transfers) is not paid yet; fulfil on `checkout.session.async_payment_succeeded`.
- **Parse the payload.** The signature proves who sent it, not its shape. Per CLAUDE.md, each
  event goes through a `(raw: unknown) => T` parser that reads only the fields the app uses.

Events a starter needs: `checkout.session.completed`,
`checkout.session.async_payment_succeeded` / `_failed`, and for subscriptions
`customer.subscription.created` / `updated` / `deleted` and `invoice.payment_failed`.

### Calling Stripe from a Worker

Two options, both work on Workers:

- **The official `stripe` package** with `Stripe.createFetchHttpClient()` and
  `constructEventAsync`. Complete and typed, but a large dependency, and it duplicates the
  webhook check we already have.
- **A thin fetch client in `@cascivo/app/stripe`** (recommended). The scaffold needs about four
  calls: create a Checkout Session, create a Portal session, retrieve a session, retrieve a
  subscription. Each is one form-encoded `fetch` with `Authorization: Bearer`, a pinned
  `Stripe-Version` and an `Idempotency-Key`. No new dependency, which matches `@cascivo/app`
  today (its only dependencies are `@cascivo/core` and `@cascivo/data`). Adopters who outgrow
  it install the SDK; nothing in the scaffold blocks that.

Local development: `stripe listen --forward-to localhost:5173/api/stripe/webhook` prints a
webhook secret for `.dev.vars`; test-mode keys and card `4242 4242 4242 4242` cover the rest.

## Email: SES, not SNS

### Why not SNS for sending

SNS is a pub/sub service. Its email protocol sends plain-text notifications to people who
subscribed to a topic and confirmed by link. It cannot set a From address or send HTML, every
message carries an AWS footer, and every recipient gets the same text. It cannot send
`@cascivo/email` templates and is not meant for newsletters.

**Amazon SES** is AWS's email service: about $0.10 per 1,000 emails, HTML and text parts, your
own domain with DKIM, and contact lists with unsubscribe handling. That is the service the idea
needs.

SNS still has a job: SES publishes **bounces and complaints** to an SNS topic, and SNS can
deliver them to an HTTPS endpoint, which can be the Worker. SES requires a sender to act on
them. An account with a high bounce or complaint rate is put under review and can lose sending.

### Running it on Cloudflare

- **Sending.** SES v2 `SendEmail` is one HTTPS call
  (`POST https://email.<region>.amazonaws.com/v2/email/outbound-emails`), signed with AWS
  Signature Version 4. SigV4 is HMAC-SHA256 and SHA-256, which WebCrypto does on Workers. It is
  about 80 lines without a dependency (`aws4fetch` is the small library alternative). The
  credentials are an IAM user's access key, scoped to `ses:SendEmail`, stored as Worker
  secrets.
- **Receiving bounces and complaints.** A Worker route subscribed to the SNS topic. It must:
  verify the message signature (RSA with SHA-256 for `SignatureVersion: 2`) against the
  certificate at `SigningCertURL`, and fetch that certificate only from
  `https://sns.<region>.amazonaws.com/`, or anyone can sign their own messages; take the public
  key out of the X.509 certificate (WebCrypto imports SPKI, not certificates, so this needs a
  small DER walk); confirm the subscription once by fetching `SubscribeURL` (same host check);
  then mark the address suppressed in D1.
- **One sender interface.** The Cloudflare Email Service binding is already wired for sign-in
  links and the digest. SES should not replace it. Both should satisfy one small
  `send({ from, to, subject, html, text, headers })` interface, so an app picks the transport
  in one place and `renderEmail` output goes to either.

### Newsletters: what has to be in the box

Sending bulk mail has rules, and Gmail and Yahoo have enforced them for bulk senders since
2024. A newsletter starter that skips them gets its mail filtered. Each item below is cheap on
Cloudflare:

| Requirement                                   | On Cloudflare                                                               |
| --------------------------------------------- | --------------------------------------------------------------------------- |
| Double opt-in (confirm by link)               | D1 `subscribers` row + signed token, the same shape as `auth-server`'s links |
| One-click unsubscribe (RFC 8058)              | `List-Unsubscribe` + `List-Unsubscribe-Post` headers, a `POST /unsubscribe` Worker route |
| Do not mail bounced or complaining addresses  | The SNS route above writes a `suppressed` flag; the send skips it           |
| Stay under SES's sending rate                 | A Queue: one message per batch of recipients, `max_batch_size` and concurrency set to the account's rate |
| SPF, DKIM, DMARC on the sending domain        | Documentation: SES gives the DNS records; Cloudflare DNS holds them          |
| See what was sent                             | D1 `campaigns` + per-recipient status, pushed live with `writeRoom`          |

SES contact lists (`ListManagementOptions`) can add the unsubscribe header and track opt-outs
on AWS's side. Keeping the list in D1 is simpler for the starter and keeps the data in the app.

## Proposal

### Phase 1: `@cascivo/app` subpaths (server-only, no new dependencies)

- `@cascivo/app/stripe`: `stripe(secretKey)` returning `createCheckoutSession`,
  `createPortalSession`, `retrieveCheckoutSession`, `retrieveSubscription`; and
  `parseStripeEvent(body)`, which narrows the events above and rejects the rest.
  `verifyWebhook` returns the Stripe event `id`.
- `@cascivo/app/ses`: `sesSender({ region, accessKeyId, secretAccessKey })` implementing the
  shared send interface; `handleSns(request, { onNotification })`, which verifies, confirms
  subscriptions and passes parsed SES bounce, complaint and delivery notifications.
- Tests: SigV4 against AWS's published test vectors, SNS verification against a certificate
  and key made in the test, Stripe calls against a stubbed `fetch`, and every parser against
  malformed input.

### Phase 2: scaffold examples

- `--example checkout`: product page, Checkout, webhook, D1 orders, receipt email, live
  "paid" status. Works with or without `--auth email`; with it, it also covers subscriptions and
  the Customer Portal.
- `--example newsletter`: sign-up with double opt-in and Turnstile, a composer that renders
  with `@cascivo/email`, Queue fan-out through SES, one-click unsubscribe, SNS suppression.

Both run under `vite dev` with nothing configured: as `digest` does today, a missing key
records `skipped` with the reason instead of failing.

### Phase 3, optional: a Deploy-button starter

`starters/shop` (one product, Checkout, receipt), generated like `starters/stage`. The Deploy
button prompts for `STRIPE_SECRET_KEY` and `STRIPE_WEBHOOK_SECRET`.

## Decisions and status

Decided 2026-10-01: a thin fetch client rather than the `stripe` SDK; SES next to the Cloudflare
Email Service binding, not instead of it; `checkout` first, then `newsletter`; the Deploy-button
starter after the examples settle.

Shipped:

- `@cascivo/app/stripe`: `createStripe` (`createCheckoutSession`, `retrieveCheckoutSession`),
  `parseCheckoutSession`, `parseStripeEvent`, `StripeError`. The Customer Portal and
  subscriptions are not in it yet. `verifyWebhook` still returns `id: null` for Stripe;
  `parseStripeEvent` reads the event id.
- `cascivo create --framework cloudflare --example checkout`: one-off payments only. Checked
  under `vite dev` in workerd with a signed event against a pending order: a bad signature is a
  401, the order settles once (a retry and a later `expired` change nothing), the order's room
  pushes one update, and one receipt is rendered. A live Stripe account was not used.

Found on the way: under Preact, `@cascivo/email` serializes `msTextSizeAdjust` as
`ms-text-size-adjust` (no leading dash), where React writes `-ms-text-size-adjust`. Only old
Microsoft clients read it.

Next: `@cascivo/app/ses` and `--example newsletter`.

What cannot be proven in this container: a real SES send, a real SNS subscription and a live
Stripe account. As with the platform spike, those need a test account. Everything else
(signing, verification, parsing, the scaffold under `vite dev`) can be tested here.
