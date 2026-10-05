---
'@cascivo/email': minor
---

Dead links block a send, and Resend is a sender.

- `checkLinks(html)` lists every link and image URL a recipient could not follow, read from
  the rendered HTML with no network: **blocked** for empty, a bare `#`, relative, an
  unreplaced merge tag (`{{url}}`, `*|URL|*`, `${id}`), a `javascript:`/`data:`/`file:`
  scheme, or a reserved placeholder domain (`example.com`, `*.invalid`); **caveat** for
  `localhost`/`*.test`, plain `http:`, an in-message `#anchor` and leftover "lorem ipsum".
  `linkUrls(html)` returns the URLs themselves.
- **Behaviour change:** `assertSendable` — and so `sendEmail` — now throws on a blocked link.
  The shipped templates default their links to `example.com`, so `<PasswordReset />` without
  `resetHref` is now refused rather than sent with a reset link that goes nowhere. Pass the
  `…Href` props; tests that send a template with its defaults need real-looking URLs.
- `resendSender(client)` adapts a `resend` SDK client to `EmailSender`: `"Name" <a@b>`
  recipients, base64 attachments with `contentType`, and Resend's `{ error }` thrown rather
  than returned. Typed by shape; no dependency on the SDK.
