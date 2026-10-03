---
'@cascivo/app': minor
---

Threads: connect an account and post to it.

- `threads({ clientId, clientSecret })` in `@cascivo/app/oauth`: the code buys a one-hour
  token, traded at once for a 60-day one; the profile names the account. Not for sign-in
  (Threads shares no email).
- `OAuthProvider.refreshAhead`: for a provider whose token renews itself rather than through a
  refresh token. `connectionTokens` renews such a token in that window. If the renewal fails,
  it keeps the token that still works and tries again on the next call.
  `refreshConnections(db, { secret, providers })` in `@cascivo/app/oauth-server` renews every
  connection that is due; call it from a daily Cron Trigger.
- `threadsPublisher({ uploadImage })` and `threadsLength` in `@cascivo/app/social`: a media
  container (text with a link card, an image, or a carousel of up to 20 with alt text), waited
  on while Meta fetches the images, then published; 500 characters with emoji counted by
  their UTF-8 bytes. Meta's error codes map to `reconnect`, `rate_limited`, `invalid` and
  `failed`.
