# What the Cloudflare app layer should take on next

Date: 2026-10-02. Follow-up to [#259](https://github.com/cascivo/cascivo/pull/259) (Stripe and
Amazon SES). Question: after payments and bulk email, which other use cases are worth building
into `@cascivo/app` and `cascivo create --framework cloudflare`, and in what order?

This started as a proposal only. Items 1–4 have since shipped; see "Status" at the end.

## How the candidates were judged

The same test as the Stripe and SES note: an adopter with an idea goes from `cascivo create` to
a working, deployed app without writing the risky part themselves. Each candidate was scored on:

- **Demand.** How many apps need it. Accounts, payments and email are near-universal; a voice
  assistant is not.
- **Risk we take off the adopter.** The best candidates are the ones that are easy to get
  _subtly_ wrong: signatures, idempotency, out-of-order events, token storage. That is where a
  tested helper beats a blog post.
- **Reuse.** How much of it is already in the repo. A candidate that composes existing
  subpaths (`db`, `guard`, `sync-server`, `jobs`, `uploads`, `@cascivo/email`) is cheap.
- **No new dependencies.** `@cascivo/app` depends only on `@cascivo/core` and `@cascivo/data`.
  `stripe` and `ses` kept that with plain `fetch` and WebCrypto. A candidate that needs a
  dependency says so.
- **Testable here.** What can be proven in the container (signing, parsing, the scaffold under
  `vite dev` in workerd), and what needs a real account.

## What #259 left open

These are small, follow directly from what shipped, and should come first.

### 1. SES as an `EmailSender` (S)

The Stripe and SES note proposed one sender interface so an app picks its transport in one
place. `@cascivo/email` has it (`EmailSender`, and `sendEmail(sender, message, envelope)` runs
`assertSendable` and the CR/LF checks), and the Cloudflare Email Service binding satisfies it.
`createSes` does not: it has its own `sendEmail(SesMessage)` with a different shape. So the
newsletter example renders with `@cascivo/email` and then sends around its gate.

Proposal: `createSes(...).sender` (or `sesSender(options)`), typed by shape like the binding,
so `sendEmail(ses.sender, renderEmail(...), envelope)` works and the receipt, the sign-in link
and the newsletter can swap transport with one line. Keep `ses.sendEmail` for the extra
SES-only fields (configuration set).

Open point: **attachments.** `OutgoingEmail` carries `attachments`; `SesMessage` does not.
SES v2 `Simple` content has accepted attachments since 2025 (to verify against the current
API reference). If it does not, the fallback is `Raw` content, which means building MIME, a
larger job. Decide before the adapter ships, or have the adapter refuse attachments with a
clear error rather than drop them.

### 2. Refunds, disputes and failed renewals (S–M)

`parseStripeEvent` types Checkout and `customer.subscription.*` events. Everything else is
`{ kind: 'other' }`, and the checkout example's orders go only `pending → paid | failed |
expired`. A real shop also needs:

| Event                                       | What the app does                                        |
| ------------------------------------------- | -------------------------------------------------------- |
| `charge.refunded`                           | Order `refunded` (or partly), revoke a download/license  |
| `charge.dispute.created` / `…closed`        | Flag the order, stop fulfilment, email the operator      |
| `invoice.payment_failed`                    | Email the customer a link to the Customer Portal (dunning) |
| `invoice.paid`                              | Optional: send our own receipt for each renewal          |

The Stripe note already listed `invoice.payment_failed` as a needed event; it did not ship.
Proposal: `parseStripeEvent` gains `kind: 'charge'`, `'dispute'` and `'invoice'` with parsers
that read only the fields used (amount refunded, the payment intent, the invoice's customer and
hosted URL), plus `createRefund(paymentIntent, { amount?, idempotencyKey })`. The example's
order table gets `refunded` and `disputed`, guarded the same way (an update conditioned on the
current status, so a late event changes nothing). A Checkout session has to carry its
`payment_intent` for the lookup.

### 3. `verifyWebhook` returns Stripe's event id (S)

Still `id: null` for the `stripe` scheme, so every Stripe handler parses the body to
deduplicate, while GitHub and Standard Webhooks get the id from the guard. Read `id` from the
verified body inside `verifyWebhook` (it already holds the text) so all three schemes look the
same to the caller.

### 4. Entitlements: from a subscription to a gated feature (S–M)

`/billing` stores the subscription, but nothing turns "this user is on Pro" into "this route
and this button are unlocked". Every SaaS adopter writes that glue, usually as scattered
`if (plan === 'pro')`.

`@cascivo/app/flags` already evaluates flags against a `FlagContext`. Proposal: put the plan
into that context (`{ plan: 'pro', planStatus: 'active' }`, from the stored subscription; a
`past_due` grace period decided in one place) and add `requireEntitlement(ctx, 'exports')`
on the Worker side, which throws an `HttpError(402)`. The browser reads the same flag to show
an upgrade prompt instead of a broken button. No new subpath; a section in the flags docs and
the `/billing` example wired through it.

### 5. A real-account smoke run (S, needs secrets)

What #259 could not prove here: a real SES send, a real SNS subscription, a live Stripe test
account. Proposal: a manually triggered workflow, with test-mode keys and an SES sandbox
identity as repository secrets, that scaffolds `--example checkout` and `--example newsletter`,
deploys to a throwaway Worker, drives one test-card checkout and one send to the SES mailbox
simulator (`success@simulator.amazonses.com`, `bounce@…`, `complaint@…`), and asserts the
order settles and the bounce is suppressed. Same shape as what the platform spike asked for
Worker Loaders. This also catches Stripe API-version drift in the parsers.

## New use cases, in recommended order

### 6. Sign in with GitHub or Google — `--auth oauth` (M)

**Why.** After payments, the next thing an adopter asks for. Magic links are a good default,
but developer tools want GitHub and consumer apps want Google. Getting OAuth right by hand is
where apps leak accounts.

**What exists.** Sessions, users and the `__Host-session` cookie in `auth-server`. JWKS fetch,
caching and RS256 verification in `requireAccess`, which is most of verifying a Google ID
token.

**Proposal.** `handleOAuth(db, { providers: { github, google }, ... })` next to `handleAuth`,
sharing its `users` and `sessions` tables, plus a `user_identities (provider, subject, user_id)`
table.

- `state` in a short-lived, HttpOnly cookie and checked on return; PKCE (`S256`) for every
  provider that supports it; `nonce` for OIDC.
- Google: verify the ID token (issuer, audience, expiry, nonce) with the JWKS code
  `requireAccess` already has, factored out. GitHub has no ID token: read `/user` and
  `/user/emails` and take only a **verified primary** email.
- **Account linking is the trap.** Never attach a new provider to an existing user because the
  emails match, unless the provider says the email is verified. Link by `(provider, subject)`,
  not by email.
- Redirect URIs come from configuration, never from the request.

Testable here against a mock provider in workerd; a real round trip needs app credentials.
`--auth oauth` scaffolds it with the provider buttons as cascivo components; it composes with
`--auth email` (both on one sign-in page).

Follow-up research on more providers (LinkedIn, Bluesky, Mastodon, Threads) and on reusing
the tokens for posting: [social-oauth-providers-research.md](./social-oauth-providers-research.md).

### 7. Teams: organisations, roles and invitations (M–L)

**Why.** The moment a SaaS has a second user per customer. Billing is per team, not per person,
so it also completes #4.

**Proposal.** `@cascivo/app/teams` on D1: `orgs`, `memberships (org_id, user_id, role)`,
`invitations` (a hashed one-time token with an expiry, the same shape as sign-in links, sent
with `@cascivo/email`). Server helpers `requireMember(db, request, orgId)` and
`requireRole(…, 'admin')` returning the membership or throwing 403/404 (404 for a non-member,
so org ids are not probable). The subscription's metadata names the org instead of the user;
the entitlement context becomes the org's plan.

Pitfalls to build in: the last owner cannot leave or be demoted; an invitation is bound to the
invited address and consumed once; every org-scoped query takes the org id from the verified
membership, never from the request body. The `sync-server` `canWrite` claims can carry the role,
so a team's room enforces it too.

Scaffold: `--auth email --example team` (or folded into `checkout --auth email` as team
billing). Fully testable here.

### 8. Receiving email — `--example inbox` (M, one dependency)

**Why.** The other half of email. Support inboxes, "reply to this email to comment", forwarding
with filtering, and catching replies to the newsletter. Cloudflare Email Routing hands a
message to a Worker's `email(message, env, ctx)` handler for free, and it is the piece of the
Cloudflare platform the scaffold does not use yet.

**Proposal.** A scaffold, not a subpath at first: an `email()` handler that parses the message,
stores it in D1 (attachments in R2 through `uploads-server`), threads it by `In-Reply-To` /
`References` or by a signed reply-to address (`reply+<token>@`), pushes it to a room, and lets
the operator answer from the app through the same `EmailSender`.

- Parsing MIME needs a parser. Cloudflare's own docs use `postal-mime` (small, no Node APIs).
  This is the one candidate that asks for a dependency, in the scaffold, not in `@cascivo/app`.
- Trust: `message.from` is the envelope sender. Check the SPF/DKIM/DMARC results Email Routing
  adds (`Authentication-Results`) before acting on a reply as that user; a signed reply-to
  token is what proves the thread, not the From header.
- Render inbound HTML only in a sandboxed iframe (the newsletter preview already does this).

Local test: wrangler and the Vite plugin can deliver a raw message to the `email` handler in
dev (to verify for the current plugin version). A real route needs a domain on Cloudflare.

### 9. Web Push notifications — `@cascivo/app/push` (M)

**Why.** "Your order shipped", "someone replied", "the import finished" when the tab is closed.
It fits the existing Queue, Workflow and webhook examples, and it works on iOS for installed
web apps since Safari 16.4.

**Proposal.** No dependency is needed: VAPID (RFC 8292) is an ES256 JWT, and payload encryption
(RFC 8291, `aes128gcm`) is ECDH P-256, HKDF and AES-GCM, all in WebCrypto on Workers.

- Server: `createPush({ vapidPublicKey, vapidPrivateKey, subject }).send(subscription, payload,
  { ttl, urgency, topic })`; a `410 Gone` from the push service returns `expired` so the caller
  deletes the subscription.
- Browser: `subscribePush(registration, publicKey)` and a parser for the subscription JSON the
  browser posts (it is untrusted input: the endpoint must be `https`, and should be checked
  against the known push-service hosts, or the Worker becomes a request forwarder).
- The scaffold needs a service worker, which the Cloudflare template does not ship today. That
  is the larger part of the work and a decision of its own (it is also what offline/PWA would
  build on).

Testable here: encryption against RFC 8291's published example vector, VAPID against a known
key. Delivery needs a browser and a real push service.

### 10. Bookings with a deposit — `--example booking` (M)

**Why.** Appointments, classes, consultations, table reservations: a large group of small
businesses, and a showcase that composes most of what exists: `Calendar`/`TimePicker`
components, Stripe Checkout, `@cascivo/email`, rooms.

**Proposal.** Availability rules in D1; a Durable Object per resource that holds a slot for
the length of a Checkout session (so two people cannot pay for the same slot; D1 alone cannot
make "check then insert" atomic across requests without a unique constraint, which is the
simpler alternative to evaluate first); Checkout `expires_at` matched to the hold; confirmation
email with an `.ics` invite (a small `toIcs(event)` helper, RFC 5545, with time zones as
`TZID` and line folding); cancellation link that refunds through #2.

Time zones are the trap: store UTC, show the visitor's zone, and generate slots in the
business's zone. Fully testable here except the payment.

### 11. Digital downloads and license keys (S–M)

**Why.** The most common one-off product an indie developer sells: an e-book, a template, a
font, a desktop app licence. The checkout example sells "a product" and stops at the receipt.

**Proposal.** An extension of `--example checkout`: on `paid`, the receipt carries a download
link: a short-lived HMAC-signed token for a Worker route that streams the file from R2
(`uploads-server` serves stored files but has no signed links yet, so this is new), with a
download count. Optional licence keys: an Ed25519 signature over
`{ product, order, email }`, verifiable offline by the adopter's app (WebCrypto supports
Ed25519 on Workers; to verify in every target browser if the key is checked client-side). A
refund (#2) revokes both.

### 12. Usage-based billing (M)

**Why.** API products and AI apps bill per call or per token. `--example usage` already counts
calls in Analytics Engine; nothing reports them to Stripe.

**Proposal.** `stripe.reportUsage({ eventName, customer, value, identifier })` against Stripe's
Billing Meters (`/v1/billing/meter_events`; the older usage-records API is gone in current API
versions). Report from a Queue consumer or a Cron in batches, with `identifier` as the
idempotency key so a retried batch is not billed twice. Analytics Engine is sampled, so the
billing count must come from a D1 counter or the Queue itself, not from an Analytics Engine
query. Say that plainly in the docs; it is the mistake an adopter would make.

### 13. A merchant of record as an alternative to Stripe (S, webhook scheme only)

**Why.** Selling digital goods into the EU means collecting and remitting VAT per country.
Paddle and Lemon Squeezy act as the seller and handle it. For a solo European developer that
often matters more than Stripe's lower fee.

**Proposal.** Not another client. Add their signature formats to `verifyWebhook`
(`paddle`: `Paddle-Signature: ts=…;h1=…` over `ts:body`; `lemonsqueezy`: hex HMAC of the body
in `X-Signature`; formats to verify against their current docs) and a docs section showing the
checkout example's order table fed by their events. Cheap, and it covers a real segment.

### 14. Account lifecycle: export and deletion (S–M)

**Why.** GDPR access and erasure requests, and app-store rules for apps with accounts. Every
app with `--auth email` will be asked.

**Proposal.** A scaffold pattern rather than a library: a registry of per-table
`exportUser(db, userId)` / `deleteUser(db, userId)` functions the app adds to as it adds
tables; export runs on a Workflow and delivers a ZIP from R2 by email (the `export` and
`import` examples have the parts); deletion re-confirms by email, cancels the Stripe
subscription, deletes or anonymises rows, and removes R2 objects. Orders kept for tax law are
anonymised, not deleted. The value is the checklist as much as the code.

## Considered and not recommended

- **Passkeys (WebAuthn).** High value, but it needs CBOR/COSE parsing and attestation decisions,
  and a bug there is an account takeover. Do it after OAuth, possibly with a small audited
  library rather than our own parser. Revisit once #6 and #7 have settled the identity model.
- **Stripe Elements, Connect, Stripe Tax set-up.** As in the previous note: product decisions,
  not scaffolds.
- **SMS.** `signAwsRequest` already makes SNS `Publish` (or any AWS API) one call. A docs recipe,
  not a feature; SMS also brings sender registration rules that differ per country.
- **Own SMTP or a self-hosted mail server.** Outbound TCP from Workers blocks port 25, and
  deliverability is the whole product anyway. SES and Email Service cover it.
- **Another email provider client (Resend, Postmark).** Their webhooks already verify with
  `scheme: 'standard'`, and their send APIs are one `fetch`. With #1 in place, an adapter to
  `EmailSender` is a five-line docs example.
- **Tenant code on Worker Loaders.** Still blocked on the real-account limits the platform spike
  listed.

## Summary

| #   | Use case                          | Size | New dependency | Provable here            |
| --- | --------------------------------- | ---- | -------------- | ------------------------ |
| 1   | SES as `EmailSender`              | S    | No             | Yes                      |
| 2   | Refunds, disputes, dunning        | S–M  | No             | Yes (mock Stripe)        |
| 3   | Stripe event id from the guard    | S    | No             | Yes                      |
| 4   | Entitlements via flags            | S–M  | No             | Yes                      |
| 5   | Real-account smoke run            | S    | No             | Needs secrets            |
| 6   | `--auth oauth` (GitHub, Google)   | M    | No             | Mock provider only       |
| 7   | Teams, roles, invitations         | M–L  | No             | Yes                      |
| 8   | `--example inbox`                 | M    | `postal-mime`  | Partly (local delivery)  |
| 9   | Web Push                          | M    | No             | Crypto yes, delivery no  |
| 10  | `--example booking`               | M    | No             | Yes, except payment      |
| 11  | Downloads and licence keys        | S–M  | No             | Yes                      |
| 12  | Usage-based billing               | M    | No             | Mock Stripe only         |
| 13  | Paddle / Lemon Squeezy webhooks   | S    | No             | Yes, from their docs     |
| 14  | Account export and deletion       | S–M  | No             | Yes                      |

Recommended order: **1–4 as one PR** (they finish #259), then **6 and 7** (identity is what
most of the rest hangs on, and team billing completes subscriptions), then **8 and 9**
(the two Cloudflare capabilities the scaffold does not use yet), then the composed examples
(**10, 11, 12**) as demand shows. 5, 13 and 14 can go in whenever someone has an afternoon.

## Decisions needed

1. Is `@cascivo/app` staying dependency-free, or may a scaffold (not the package) take
   `postal-mime` for inbound email?
2. OAuth: which providers ship first? GitHub and Google are proposed; Apple adds a JWT client
   secret and a private-relay email.
3. Teams: a separate `--example team`, or team billing as the default shape of
   `checkout --auth email`?
4. Should the Cloudflare template ship a service worker (needed by Web Push, and by offline/PWA)?
5. Is a real-account workflow with repository secrets acceptable, and who owns the test
   accounts?
6. Merchant of record: worth the docs and two webhook schemes now, or only on request?

## Status

Shipped 2026-10-02, items 1–4 as one change:

- **1.** `createSes(...).send(message)` makes the SES client an `EmailSender`:
  `sendEmail(ses, renderEmail(…), envelope)` works, with display names (RFC 2047 when not
  ASCII), cc, bcc, reply-to and attachments. SES v2 `Simple` content does take attachments
  (`Attachments`, base64 `RawContent`), checked against the API reference, so no MIME building
  was needed. `--example newsletter` now sends through `sendEmail`, and refuses an issue too
  large to send before queueing it.
- **2.** `parseStripeEvent` types `charge.refunded` (`kind: 'refund'`), `charge.dispute.*`
  (`kind: 'dispute'`) and `invoice.paid` / `invoice.payment_failed` (`kind: 'invoice'`).
  `createRefund` exists; a Checkout session carries `paymentIntentId`. The checkout example
  stores the payment intent, records refunds by the running total (`refunded` when all of it
  is), and marks chargebacks `disputed` (back to `paid` when won), storing the dispute's status
  so a late `created` cannot reopen a closed one. `/billing` emails a failed renewal once per
  attempt, with the invoice's hosted page. The operator is told about a dispute in the log
  only; emailing them needs an address the example does not have yet.
- **3.** `verifyWebhook` returns the Stripe event id.
- **4.** `isEntitled(status, { pastDue? })` and `requireEntitlement(status)` (402) in
  `@cascivo/app/stripe`; `past_due` counts while Stripe retries, so the dashboard's
  failed-payment settings are the one place the grace period is set. `/billing` uses them and
  gains a `requirePlan` helper. The flags part is documentation (the plan as a flag context
  attribute) rather than wiring: the scaffold has no flag service to wire it to.

Still unproven without accounts, as before: a real refund, dispute and failed renewal from
Stripe, and a real SES send with an attachment.
