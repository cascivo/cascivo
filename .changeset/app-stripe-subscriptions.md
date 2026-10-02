---
'@cascivo/app': minor
---

`@cascivo/app/stripe` takes subscriptions. `createCheckoutSession` accepts
`mode: 'subscription'`, recurring inline prices (`interval`), an existing `customer`, and
`subscriptionMetadata`, which only the server can set and every subscription event carries.
New: `retrieveSubscription` and `parseSubscription` (the billing period is read from the
subscription or its first item, so older and newer API versions both work), and
`createPortalSession` for Stripe's hosted Customer Portal. `parseStripeEvent` types the
`customer.subscription.*` events as `kind: 'subscription'`, and a Checkout session now carries
`mode`, `customerId` and `subscriptionId`.
