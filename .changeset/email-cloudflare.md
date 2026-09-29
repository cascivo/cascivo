---
'@cascivo/email': minor
---

`sendEmail(sender, message, envelope)` sends a rendered email through Cloudflare's Email
Service binding, or any sender whose `send()` takes `{ from, to, subject, html, text }`.

- It runs `assertSendable` first, so a message with no subject, no preheader, no text part
  or a clipped body never leaves.
- CR/LF in any address, display name or header is rejected, because it would inject headers.
- The sender is typed by shape (`EmailSender`), so the package still needs no Cloudflare
  types. The binding's own `SendEmail` type satisfies it.
