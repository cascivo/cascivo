---
'cascivo': minor
'@cascivo/mcp': patch
---

`cascivo create --framework cloudflare --example checkout`: sell a product with Stripe
Checkout. The Worker prices the order, opens a hosted Checkout page, checks Stripe's webhook
signature, and settles each order once in D1. The order page updates live through a read-only
room, and a paid order gets a receipt rendered with `@cascivo/email` and sent through Email
Service. A Stripe test key is enough in `vite dev`: the order page reads the session back
before any webhook is set up. With `--auth email`, Stripe's webhook is exempt from the sign-in
rule, as GitHub's is. The MCP `create_app` tool accepts the new example.
