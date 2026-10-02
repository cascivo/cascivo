---
'@cascivo/app': minor
---

`@cascivo/app/stripe`: Stripe Checkout from a Worker over plain `fetch`, with no SDK.
`createStripe(secretKey)` creates and reads back Checkout Sessions (idempotency keys, inline or
dashboard prices, a pinned API version), and throws `StripeError` with Stripe's status, type
and code. `parseStripeEvent(body)` reads a webhook body that `verifyWebhook` has checked: the
four Checkout events come back typed with their session, and every other event as
`kind: 'other'`.
