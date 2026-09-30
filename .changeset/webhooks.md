---
'@cascivo/app': minor
'cascivo': minor
'@cascivo/mcp': minor
---

Verified inbound webhooks.

- `verifyWebhook(request, { scheme, secret })` in `@cascivo/app/guard` checks a signature over
  the raw body and returns `{ body, id }`; anything else is a 401.
  - Schemes: GitHub (`X-Hub-Signature-256`), Stripe (`Stripe-Signature`, with a timestamp
    window against replays) and Standard Webhooks (`whsec_` secrets, rotation, a timestamp
    window).
  - Signatures are compared by WebCrypto's HMAC verify, in constant time.
- `cascivo create --framework cloudflare --example webhooks` scaffolds a `/webhooks` page:
  - GitHub deliveries are verified, stored once each in D1 by delivery id, and pushed live.
  - A "Send a test delivery" button runs a signed sample through the same path.
  - With `--auth email`, webhooks are exempt from the sign-in rule and checked by signature.
- Fix: the scaffold's `/api/rooms/:name` route opened any room read-write, including the rooms
  only the server writes. A browser could forge an import job's progress. It now refuses those
  names, and it is emitted only with a room clients may write (board, notes).
- The MCP tool `create_app` accepts `examples: ['webhooks']`.
