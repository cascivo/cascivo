# cascivo-shop

A [cascivo](https://cascivo.com) app on Cloudflare: a client-rendered
Preact app and its API, deployed as one Worker.
There is no server rendering; the browser gets the app, and `/api/*` reaches the Worker.

## Develop

```sh
npm install
npm run dev
```

`vite dev` runs `worker/index.ts` in workerd, the same runtime as production, via
`@cloudflare/vite-plugin`.

## Deploy

```sh
npx wrangler login   # once
npm run deploy
```

## Share a preview (no account)

```sh
npm run deploy:preview
```

This builds the app, then deploys it to a temporary Cloudflare account with
`wrangler deploy --temporary`. You need no sign-up. It prints two URLs:

- **A public `workers.dev` URL** for the app.
- **A claim URL.** Open it and sign in within 60 minutes to keep the deployment; otherwise it is deleted.

It works only while wrangler is logged out. If you are logged in, use `deploy` instead.
A temporary account supports Workers, static assets, KV, D1 and Durable Objects. It does not
support Workers AI, R2, Workflows or Browser Run.

## Structure

- `src/routes/` — one file per page. `index.tsx` is `/`, `settings.tsx` is
  `/settings`, `c/[id].tsx` is `/c/:id` (it receives `params.id`), `404.tsx` is
  everything else. `src/routes.gen.ts` is rewritten from this folder; do not edit it.
- `src/api.ts` — the API contract both sides import: endpoints, their paths, and parsers
  for what crosses the network.
- `worker/index.ts` — the API's handlers, typed from `src/api.ts`. Add bindings (KV,
  D1, R2, Durable Objects, Workers AI) in `wrangler.jsonc`; handlers receive them as `env`.
- `src/live.ts` + `src/LiveCard.tsx` — a streaming endpoint read through the typed
  client into signals.
- `src/App.tsx` — the nav (real `href`s) and the `RouterView`.
- `src/Shell.tsx` — the app shell (header + side nav + content slot).

Persist client state with `persistedSignal` from `@cascivo/storage` (localStorage or
IndexedDB).

## Checkout (Stripe)

`/checkout` sells one product on Stripe's hosted Checkout page: the card never touches this
app. Stripe tells the Worker when the payment succeeds; the Worker marks the order paid, pushes
it to the order page, and emails a receipt rendered with `@cascivo/email`.

1. In the Stripe dashboard, in test mode, copy the secret key (`sk_test_…`) into `.dev.vars`
   as `STRIPE_SECRET_KEY`, then run the app and buy with the card `4242 4242 4242 4242`.
   The order page confirms the payment by reading the session back from Stripe, so this works
   before any webhook is set up.
2. To receive the webhook locally, run
   `stripe listen --forward-to localhost:5173/api/stripe/webhook` (the Stripe CLI) and put the
   `whsec_…` secret it prints in `.dev.vars` as `STRIPE_WEBHOOK_SECRET`.
3. Deployed: `npx wrangler secret put STRIPE_SECRET_KEY` and
   `npx wrangler secret put STRIPE_WEBHOOK_SECRET`. In the dashboard, add a webhook endpoint
   at `https://<your app>/api/stripe/webhook` for `checkout.session.completed`,
   `checkout.session.async_payment_succeeded`, `checkout.session.async_payment_failed` and
   `checkout.session.expired`; its signing secret is `STRIPE_WEBHOOK_SECRET`.
4. Receipts: set `RECEIPT_FROM` in `wrangler.jsonc` to an address on a domain you have
   onboarded to Email Service. `vite dev` renders each receipt and logs it instead.

What you sell is `PRODUCT` in `src/checkout.ts`. The Worker sends that price to Stripe, so a
browser cannot change it.

- `worker/checkout.ts` — `createStripe` (`@cascivo/app/stripe`) creates the session, with
  the order id as its idempotency key. The webhook is checked by `verifyWebhook` (scheme
  `stripe`: signature and a five-minute window) before `parseStripeEvent` reads it.
- An order moves from `pending` to `paid`, `failed` or `expired` once. A retried event, or
  the page getting there before the webhook, changes nothing, so the receipt goes out once.
  Orders are found by Stripe's session id, never by `client_reference_id`, which a buyer can
  set on a Payment Link.
- A bank debit completes the session as `unpaid`: the order stays pending until
  `async_payment_succeeded` or `async_payment_failed` arrives, possibly days later.
- `src/routes/checkout/[order].tsx` — where Stripe sends the buyer back. It watches the
  order's read-only room, so it updates when the webhook arrives.

Each caller (by IP) may start 20 checkouts a minute.

Subscriptions need an account to belong to: `cascivo create --framework cloudflare
--example checkout --auth email` adds a `/billing` page with a monthly plan and Stripe's
billing portal.

Add more components with `npx cascivo add <component>`.

## Preact or React

The source is typed against React. The runtime is one plugin in `vite.config.ts`:
`@preact/preset-vite` runs it on Preact, `@vitejs/plugin-react` on React. Switching
needs no source changes; swap the plugin and the matching dependencies. For this starter,
Preact ships about a third of the client JS (~27 KB gzip against ~85 KB).
