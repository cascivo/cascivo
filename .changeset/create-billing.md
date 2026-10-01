---
'cascivo': minor
---

`cascivo create --framework cloudflare --example checkout --auth email` adds `/billing`: a
monthly plan on Stripe Checkout, managed in Stripe's Customer Portal. The subscription names its
user in metadata only the Worker sets; every subscription event is read back from Stripe
before it is stored, and a late event about an older subscription cannot end a live one.
Back from checkout, the page syncs the session at once, for the user the subscription names
only.

A fresh app with a short name (`cascivo create app`) no longer fails its own `format:check`:
the shell's `<AppShell>` tag is written on one line when it fits, as Prettier writes it.
