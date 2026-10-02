---
'@cascivo/app': minor
---

`@cascivo/app/stripe` covers what happens after the sale:

- `parseStripeEvent` types `charge.refunded` (`kind: 'refund'`, with the running refunded
  total), `charge.dispute.created` / `…closed` (`kind: 'dispute'`) and `invoice.paid` /
  `invoice.payment_failed` (`kind: 'invoice'`, with the subscription from either API
  version's place for it). `parseCharge`, `parseDispute` and `parseInvoice` read each object.
  `invoice.paid` was `kind: 'other'` before.
- `createRefund({ paymentIntent, amount?, reason?, metadata? }, { idempotencyKey })`.
- A Checkout session carries `paymentIntentId`, which refund and dispute events name.
- `isEntitled(status, { pastDue? })` and `requireEntitlement(status)` (a 402): whether a stored
  subscription status unlocks the plan, `past_due` included while Stripe retries a renewal.

`verifyWebhook` with `scheme: 'stripe'` now returns the event's id (`evt_…`) from the verified
body, where it returned `null`, so all three schemes deduplicate the same way.
