---
'@cascivo/app': minor
---

LinkedIn, connected accounts, and posting.

- `linkedin()` in `@cascivo/app/oauth`: sign-in over OpenID Connect, the ID token verified
  against LinkedIn's keys. Add `w_member_social` to its scopes to post with the tokens.
  `parseTokenSet` checks a token set read back from storage.
- `handleConnections(db, { providers, secret })` in `@cascivo/app/oauth-server` lets a
  signed-in user connect an account so the app can act for them: `GET /api/connections`,
  `GET /api/connections/<provider>` to connect, `DELETE /api/connections/<id>`. Tokens are
  sealed at rest and bound to their row. `connectionTokens` hands them to their owner,
  refreshing on use: one request at a time holds the refresh, so providers that replace their
  refresh token on every use are safe. `listConnections` reports `active`, `expiring` (a token
  that cannot be refreshed ends soon) or `reconnect`; `markReconnect` records a refusal.
- `@cascivo/app/social`, a new entry: `linkedinPublisher()` posts text, a link card, one
  image or several to the member's feed, with `check(post)` listing what LinkedIn would refuse
  before anything is sent, text escaped for LinkedIn's format (hashtags kept), and a
  `PublishError` whose `kind` says whether to fix the post, reconnect, or retry.
