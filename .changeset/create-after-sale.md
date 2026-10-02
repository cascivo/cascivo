---
'cascivo': minor
---

`cascivo create --framework cloudflare --example checkout` handles refunds and chargebacks: an
order stores its payment when it is paid, `charge.refunded` records the refunded amount (an
order refunded in full becomes `refunded`), and a dispute makes it `disputed` until it is won.
The order page shows each. With `--auth email`, `/billing` gates the plan with
`isEntitled`/`requireEntitlement` (a `requirePlan` helper for paid features, `past_due` kept
on while Stripe retries) and emails the customer once per failed renewal attempt, with Stripe's
page to pay the invoice.

`--example newsletter` sends through `sendEmail` from `@cascivo/email` with the SES client as
its sender, and refuses an issue too large to send before it is queued.
