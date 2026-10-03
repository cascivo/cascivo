---
'@cascivo/app': minor
---

Buffer: connect a user's Buffer, and post through it.

- `buffer({ clientId, clientSecret? })` in `@cascivo/app/oauth`: OAuth with PKCE, consent and
  offline access; refresh tokens are single-use and renewed under `connectionTokens`' lease. A
  connection is the account's Buffer organization. `bufferQuery` calls the GraphQL API and
  reads errors sent with a 200 (`errors[]`, `extensions.code`) and `Retry-After`.
- `bufferPublisher({ service, uploadImage })`, `bufferChannels()` and `bufferTokens(apiKey)` in
  `@cascivo/app/social`: post to a channel now or at a later `createdAt`, checked against the
  limit of the network behind it; images by public URL; a personal API key works as tokens.
- `PublishedPost.url` is `string | null` (Buffer has no URL until it sends the post), and
  `PublishError` carries `retryAfter`.
