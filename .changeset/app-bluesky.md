---
'@cascivo/app': minor
---

Bluesky (any AT Protocol account): sign in, connect, and post.

- `bluesky()` in `@cascivo/app/oauth`: the flow takes a handle or DID, resolves it (DNS over
  HTTPS, then `/.well-known/atproto-did`) to the DID document, PDS and authorization server,
  and runs AT Protocol OAuth: pushed authorization requests, PKCE, DPoP on every request with
  the nonce retry, the callback's `iss`, and the check that the tokens' `sub` is the DID whose
  document points at that server. The loopback client in development, a public web client, or
  a confidential one with `privateKey` (`private_key_jwt`). `blueskyClientMetadata`,
  `blueskyJwks` and `parseBlueskyKey` for serving the client.
- A provider may set `dpop` (the flow makes a key: `PendingAuthorization.dpopKey`), build its
  authorization URL asynchronously, name its resolved `server`, and read the callback's
  parameters in `exchange`. `TokenSet.dpop` carries a bound session's key, issuer and client id.
- `blueskyPublisher()`, `blueskyLength()`, `blueskyFacets()` and `blueskyRecordKey()` in
  `@cascivo/app/social`: graphemes, facets at UTF-8 byte offsets with mentions resolved, link
  cards, images, and a record key fixed by `idempotencyKey` and the new `createdAt` option so a
  retry finds the post it already made.
