---
'@cascivo/app': minor
---

Mastodon (and servers that speak its API): sign in, connect, and post.

- `mastodon({ appName, registrations })` in `@cascivo/app/oauth` is a provider for many
  servers. The flow takes the user's server as `?server=`; `forServer` discovers its endpoints,
  registers the app there once, and uses PKCE and the `profile` scope where the server
  announces them (4.3+), `read:accounts` before that. The server name is distrusted:
  `normalizeServer` refuses IPs, ports and local names, and every call to it has a timeout, no
  redirects and a size cap. `OAuthProvider.forServer` and `PendingAuthorization.server` carry
  this through any flow; `OAuthErrorCode` gains `bad_server`.
- `mastodonRegistrations(db, secret)` in `@cascivo/app/oauth-server` keeps registrations in
  D1, client secrets sealed. A connection records its `server`.
- `mastodonPublisher()` and `mastodonLength()` in `@cascivo/app/social`: Mastodon's character
  counting, the link appended for the server to build its card, images uploaded and waited
  for, and `Idempotency-Key` from the new `publish(…, { idempotencyKey })` option.
- The browser `auth.signInUrl(provider, returnTo, server)` takes the server.
