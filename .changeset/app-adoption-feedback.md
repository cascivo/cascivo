---
'@cascivo/app': minor
---

Fixes and additions from an adoption report (`ses`, `guard`, `social`, `oauth`).

- **`verifyWebhook({ scheme: 'standard' })` reads Svix's header names.** `svix-id`,
  `svix-timestamp` and `svix-signature`, which Resend and Clerk send, are read when the
  `webhook-*` spellings are absent. Before, a real Resend delivery failed at `no webhook-id`.
- **`verifyWebhookBody(body, headers, options)`** verifies a body already read, without
  building a `Request`; `verifyWebhook` now wraps it.
- **`verifySnsMessage` / `handleSns` take `topicArn` as one ARN, a list, or a test**, and the
  doc says plainly that a signature proves AWS sent a message, not that it concerns you.
- **Behaviour change: `handleSns` no longer confirms subscriptions on its own.** Pass
  `confirmSubscriptions: true` to keep confirming, or `onSubscription(subscription)` to hand
  the topic and token to an operator. When it confirms, it rebuilds the request from the
  verified `TopicArn` and `Token` instead of fetching the message's `SubscribeURL`.
- **`confirmSnsSubscription({ topicArn, token })`** confirms on the topic's own regional SNS
  host and returns `{ subscriptionArn }`.
- **`ses.identity(domain)`** (SES v2 `GetEmailIdentity`): `verified`, the DKIM status, and the
  three Easy DKIM CNAME records on the region's own DKIM zone; `null` for an unknown identity.
- **`SesEvent` carries `at`** (the event's own time, epoch ms), and a bounce its `subType`
  and the receiving server's `diagnostic`.
- **`verifyTurnstile` throws `TurnstileError`**, an `HttpError(403)` with Cloudflare's
  `errorCodes` and a `reason`; `turnstileResult` returns the same outcome as a value.
- **`social`: replies and threads.** `PublishOptions.replyTo` posts a reply (Mastodon,
  Threads, Bluesky) or a comment on the share (LinkedIn); Buffer refuses it.
  `publishThread(publisher, target, posts)` chains them, and a failure carries the parts
  already `published`. `PublishedPost.replyRef` holds what a Bluesky reply needs.
- **`measure(text)` and `limits.unit`**: each publisher's own count, and its unit in words.
  Every factory now returns `MeasuredPublisher`, where both are present; on the `Publisher`
  interface they are optional, so a `Publisher` you implement yourself still compiles.
- **Images by URL**: `SocialImageUrl` (`{ url, alt }`) next to `{ data, alt }`; Threads and
  Buffer pass the URL on, the others fetch it.
- `LINKEDIN_VERSION` is exported; `FacetFeature` names the three facet types
  (`Facet.features` stays `Record<string, string>[]` until a major can narrow it);
  `renewalDue(provider, tokens)` in `oauth` is the token-renewal rule without a database.
- Docs: `normalizeServer` strips credentials rather than refusing them; `escapeLittleText`
  runs once, last, URLs included; `social` has no direct X publisher; the README names the
  lockstep version set.

Semver: additive throughout (new names, optional fields, widened `topicArn` and image types,
new fields on the `SesEvent` and `Ses` values the package returns). The one behaviour change
is `handleSns` confirming only when asked, made a minor because the old default followed a
URL from its input on an unauthenticated path.
