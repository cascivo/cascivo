# Social sign-in and social publishing: OAuth providers for the app layer

Date: 2026-10-03. Follow-up to [#261](https://github.com/cascivo/cascivo/pull/261) and item 6
of [app-layer-next-use-cases-research.md](./app-layer-next-use-cases-research.md)
(`--auth oauth`). Question: can Google, GitHub, LinkedIn, Bluesky, Mastodon and Threads be
integrated easily, and can the provider adapters be designed so the same tokens also drive
something other than sign-in, such as a social sharing and scheduling app?

The open questions were decided on 2026-10-03 (see "Decisions"), and Buffer was added as a
seventh integration. Nothing here has shipped yet.

## Short answer

| Provider | Sign-in            | Posting on the user's behalf | Effort | Main obstacle                                                |
| -------- | ------------------ | ---------------------------- | ------ | ------------------------------------------------------------ |
| Google   | Easy (OIDC)        | No general API               | S      | None for sign-in                                             |
| GitHub   | Easy (OAuth 2)     | Not a social network         | S      | No ID token: read `/user` and `/user/emails`                 |
| LinkedIn | Easy (OIDC)        | Yes, self-serve              | S–M    | No refresh token: the user reconnects every 60 days          |
| Mastodon | Medium             | Yes, no review               | M      | One OAuth server per instance; client registered per instance |
| Bluesky  | Hard to do right   | Yes, no review               | M–L    | PAR + DPoP + identity resolution are mandatory               |
| Threads  | Possible, not wise | Yes, after Meta review       | M      | App Review + Tech Provider verification; no email, no PKCE   |
| Buffer   | Not a provider     | Yes, through Buffer's queue  | S      | The adopter's Buffer plan caps requests for all their users  |

All six work over plain `fetch` and WebCrypto, so `@cascivo/app` can stay
dependency-free. The work is uneven. Google and GitHub are a week together. Bluesky alone is
about as much again, because its OAuth profile is the strictest of the six.

The second question has a clear answer too: **yes, if sign-in and "connected accounts" are two
uses of one adapter, not two features.** The adapter knows the protocol and the provider. What
happens to the tokens afterwards (make a session and discard them, or encrypt and keep them
for posting) is the caller's choice. The design below keeps that line.

## How each provider was judged

The same test as the earlier notes: an adopter goes from `cascivo create` to a deployed app
without writing the risky part themselves. Per provider:

- **Protocol.** OIDC (an ID token we verify) or plain OAuth 2 (we call a profile endpoint).
  PKCE, PAR, DPoP.
- **Identity.** What the stable subject is, and whether there is a _verified_ email. That
  decides whether account linking by email is ever safe.
- **Token life.** Access and refresh lifetimes, whether refresh tokens rotate. This decides
  how much work a long-lived "connected account" is.
- **Posting.** Whether there is a write API for a user's own feed, and what it costs:
  review gates, media handling, text rules.
- **Gate.** What an adopter must do in the provider's console before the first real user can
  sign in.

## The providers

### Google

- **Protocol.** OIDC. Authorization code + PKCE (`S256`), `nonce`. Discovery at
  `https://accounts.google.com/.well-known/openid-configuration`.
- **Identity.** `sub` is stable. `email` with `email_verified`. For a Google Workspace
  account, `hd` names the domain, which is useful for "only people at acme.com".
- **Tokens.** Access token about 1 hour. A refresh token only with `access_type=offline`, and
  usually only on the first consent unless `prompt=consent` is sent. Sign-in does not need one.
- **Posting.** None for a general social feed. The Google APIs worth a token are Calendar,
  Drive, Gmail and YouTube, and their scopes are "sensitive" or "restricted": Google verifies
  the app, and restricted scopes need a yearly security assessment. Out of scope here, but the
  adapter should not stop an adopter from asking for more scopes.
- **Gate.** An OAuth client in Google Cloud and a consent screen. `openid email profile` needs
  no verification. Unverified apps show a warning and a 100-user cap only for sensitive scopes.
- **Reuse.** Verifying the ID token is what `requireAccess` in `guard.ts` already does for
  Cloudflare Access: JWKS fetch, caching, `kid` rotation, RS256, `iss`, `aud`, `exp`. Factor
  it out into `verifyJwt({ jwksUrl, issuer, audience })` and both use it.

**Verdict: easy.** The reference provider for the OIDC path.

### GitHub

- **Protocol.** OAuth 2, no OIDC for user sign-in (GitHub's OIDC issuer is for Actions, not
  users). PKCE (`S256` only) has been supported for OAuth Apps and GitHub Apps since
  2025-07-14; not required, but we should always send it.
- **Identity.** `id` from `GET /user` (numeric; never the login, which can be renamed).
  Email from `GET /user/emails` (scope `user:email`): take only the entry with
  `primary: true` **and** `verified: true`. The email in `/user` is the public profile email,
  may be empty, and is not proof of anything.
- **Tokens.** An OAuth App's token does not expire. A GitHub App's user token expires after
  8 hours, with a refresh token good for 6 months. For sign-in, an OAuth App is simpler.
- **Posting.** Not a social network. A developer tool may want to create a gist, comment on an
  issue or open a discussion with the user's token; the generic "connected account" covers
  that without anything GitHub-specific.
- **Gate.** An OAuth App in developer settings. No review.

**Verdict: easy.** The reference provider for the "plain OAuth 2 + profile call" path.

### LinkedIn

- **Protocol.** "Sign In with LinkedIn using OpenID Connect": scopes `openid profile email`,
  an ID token, JWKS. A standard web app authenticates with its client secret. LinkedIn's PKCE
  is for native clients and has to be enabled for the app, so the web flow is
  `state` + secret, not PKCE.
- **Identity.** `sub`; `email` and `email_verified` in the ID token.
- **Tokens.** Access token **60 days**. Refresh tokens (365 days) exist only for approved
  Marketing partners. A self-serve app sends the member through authorization again; when the
  member is still signed in to LinkedIn and the scopes are unchanged, that is a redirect with
  no consent screen. So a sharing app must track `expires_at` and ask for a reconnect in time.
- **Posting.** The "Share on LinkedIn" product is self-serve and grants `w_member_social`.
  `POST https://api.linkedin.com/rest/posts` with author `urn:li:person:{sub}`. Every call
  carries a `LinkedIn-Version: YYYYMM` header, and old versions are retired on a schedule
  (202510 sunsets on 2026-10-15). Pin the version in one constant and test against it.
  - The `commentary` field uses LinkedIn's "little text" format: `( ) [ ] { } < > @ | ~ _ *
    \` must be escaped or the post is cut or rejected. A typed text builder must do this, not
    the caller.
  - Images: `POST /rest/images?action=initializeUpload`, `PUT` the bytes to the returned URL,
    then reference the image URN. Link previews: pass the article URL; LinkedIn does not
    always fetch the card, so a thumbnail is uploaded the same way.
  - Company pages need `w_organization_social`, which is a partner product. Out of scope.
- **Gate.** A LinkedIn app tied to a company page, plus the two self-serve products.

**Verdict: sign-in is easy; posting is easy to call and fiddly to get right** (escaping,
versions, the 60-day reconnect).

### Mastodon (and the wider fediverse)

- **Protocol.** OAuth 2 per **instance**: every server is its own authorization server, and
  the user types theirs (`mastodon.social`, `hachyderm.io`, …). The app registers itself with
  each instance on first use: `POST /api/v1/apps` returns a `client_id` and `client_secret`
  for that instance. Since 4.3: `/.well-known/oauth-authorization-server` metadata, PKCE
  (`S256`), the `profile` scope (read only `verify_credentials`), and registered apps are no
  longer garbage-collected.
- **Identity.** `GET /api/v1/accounts/verify_credentials`. The stable key is
  `(instance host, account id)`; `acct` (`user@host`) is display only. **No email.**
- **Tokens.** Do not expire; they last until revoked. A `401` means "reconnect".
- **Posting.** `POST /api/v1/statuses` (scope `write:statuses`) with an `Idempotency-Key`
  header, which makes retries safe. Media via `POST /api/v2/media` (`write:media`), which may
  answer `202` and need polling until processed. Limits come from the instance:
  `GET /api/v2/instance` → `configuration.statuses.max_characters` (500 by default), and every
  URL counts as 23 characters.
- **Other software.** GoToSocial, Pleroma/Akkoma and Iceshrimp implement the Mastodon client
  API well enough for apps, statuses and media. Misskey does not (MiAuth). Threads federates
  over ActivityPub but does not speak the Mastodon client API.
- **Gate.** None. That is the attraction and the risk:
  - The instance host is **user input** that the Worker fetches. Normalize it (lowercase,
    punycode, no path, no port), require `https`, refuse IP literals and single-label names,
    put a timeout and a size cap on every response.
  - Registrations are rows in our database created by strangers. Cache them per instance in
    D1, rate-limit `connect` per IP, and put Turnstile in front of it.
  - Pre-4.3 servers: fall back to no PKCE and the `read:accounts` scope, decided from the
    metadata document's presence, not from a version string.

**Verdict: medium.** No single hard part; several small ones that a helper should own.

### Bluesky (AT Protocol)

- **Protocol.** OAuth 2.1 with the AT Protocol profile, the strictest of the six:
  - `client_id` is an **HTTPS URL** to our client metadata JSON. The Worker serves it (and,
    for a confidential client, a `jwks.json`).
  - **PAR is mandatory**: the authorization parameters are pushed to the server first.
  - **PKCE `S256` is mandatory.**
  - **DPoP is mandatory** for every token and every API call: each request carries a proof
    JWT signed with an ES256 key the client holds. Server-issued DPoP nonces are mandatory
    too (5-minute lifetime), so every call needs the "`use_dpop_nonce` → retry once with the
    new nonce" loop.
  - A confidential client authenticates with `private_key_jwt` (another ES256 key, a Worker
    secret). A public client is possible but gets shorter sessions.
- **Discovery.** The user types a handle (`alice.bsky.social` or `alice.com`). Handle → DID
  (DNS `TXT _atproto.<handle>`, which a Worker can query over DNS-over-HTTPS, or
  `https://<handle>/.well-known/atproto-did`) → DID document (`plc.directory` for `did:plc`,
  `/.well-known/did.json` for `did:web`) → the PDS → its
  `/.well-known/oauth-protected-resource` → the authorization server's metadata.
- **Identity.** `sub` in the token response is the DID. **The client must check that this DID
  resolves to the same authorization server it used**; otherwise a hostile server can claim
  anyone's DID. This is the step a hand-rolled client is most likely to skip. Email only with
  `transition:email` or the granular `account:email` scope.
- **Tokens.** Access tokens under 30 minutes (15 if the server cannot revoke them).
  Refresh tokens **rotate** (single use). Sessions: 2 weeks for a public client; a
  confidential client's refresh tokens last up to 180 days and its session may be unlimited.
- **Scopes.** `atproto` is required. `transition:generic` is the broad, transitional grant.
  The granular permission syntax is specified and lets an app ask for exactly what it does:
  `repo:app.bsky.feed.post?action=create blob:image/*`. Check which form `bsky.social`
  accepts at implementation time and prefer the granular one.
- **Posting.** `com.atproto.repo.createRecord` with an `app.bsky.feed.post` record:
  - 300 graphemes.
  - Links, mentions and hashtags are **facets** with **UTF-8 byte** offsets, not string
    indices. Mentions also need the handle resolved to a DID. A wrong offset silently
    misplaces the link.
  - Link cards are not fetched by Bluesky: the client fetches the page's Open Graph tags,
    uploads the thumbnail as a blob and embeds `app.bsky.embed.external`.
  - Images: `uploadBlob` (about 1 MB each), up to four, with alt text.
  - Choosing the record key (a TID) on our side makes a retry idempotent: a duplicate
    `rkey` fails instead of posting twice.
- **Gate.** None. Development uses the spec's `http://localhost` client exception.

**Verdict: hard to do right, but entirely doable without a dependency.** ES256 signing,
JWK thumbprints and JWT assembly are WebCrypto. **Decided: our own client**, not
`@atproto/oauth-client`, so the package stays dependency-free and Workers-native. The cost is
that we own spec changes; the mock-server tests below are what keeps that honest.

### Threads

- **Protocol.** OAuth 2 against Meta: `https://threads.com/oauth/authorize`, token at
  `https://graph.threads.com/oauth/access_token`. Client secret; PKCE is not documented.
- **Identity.** `user_id` from the token response, `GET /me?fields=id,username`. **No email.**
  Meta does not position Threads as a sign-in provider.
- **Tokens.** Short-lived token (1 hour) → exchange for a long-lived one (60 days)
  (`grant_type=th_exchange_token`). A long-lived token can be refreshed
  (`th_refresh_token`) only once it is at least 24 hours old and before it expires; miss the
  window and the user reconnects. Permission grants for public profiles last 90 days and are
  extended by a refresh. So a sharing app needs a scheduled refresher.
- **Posting.** Scope `threads_content_publish`. Two steps: create a media container
  (`POST /me/threads`, text and/or a **public** image or video URL that Meta fetches), then
  publish it (`POST /me/threads_publish`). Video containers must be polled until finished.
  500 characters; 250 published posts per 24 hours per profile. Media must be reachable at a
  public URL, so R2 needs a public or presigned URL, not a Worker-only binding.
- **Gate.** The real obstacle. Users without a role on the app can grant permissions only
  after **App Review** for each permission **and Tech Provider verification** (identity
  verification of the developer's business, about a week). Until then, only testers listed on
  the app can connect.

**Verdict: technically medium, procedurally heavy.** Support it as a connected account for
posting. Do not offer it as a sign-in method: no email, and the review burden falls on every
adopter before their first stranger can sign in.

### Buffer

Buffer is not a network but a scheduler in front of eleven of them (Bluesky, Threads, LinkedIn,
Mastodon, X, Instagram, Facebook, TikTok, YouTube, Pinterest, Google Business Profile). For an
adopter it is the cheap way to reach the networks we do not integrate (X, Instagram, TikTok),
and to use queue slots and posting times the user already set up in Buffer.

- **API.** GraphQL at `https://api.buffer.com`, `Authorization: Bearer …`. The current API is
  new (public beta in 2026) and is not the old REST API, which stopped accepting new apps.
- **Auth.** Two ways, and we support both:
  - A **personal API key** (Settings → API). Right for a single-owner app: the operator's own
    Buffer account, the key as a Worker secret, no OAuth at all.
  - **OAuth 2** for an app whose users connect _their own_ Buffer: authorize at
    `https://auth.buffer.com/auth`, token at `https://auth.buffer.com/token`. **PKCE is
    mandatory.** Access tokens last 1 hour; a refresh token comes only with `offline_access`
    and is **single-use**, rotated on every refresh. That is the same rotation race as Bluesky,
    so the same guard applies. Scopes: `posts:read`, `posts:write`, `ideas:read`,
    `ideas:write`, `account:read`, `account:write`, `offline_access`.
- **Identity.** `account { id email organizations { id } }`. Buffer is a connection, not a
  sign-in method: nobody expects "Sign in with Buffer".
- **Posting.** `query { account { organizations { id } } }`, then the organization's channels
  (one per connected social profile), then `createPost(input: { channelId, text,
  schedulingType: automatic, mode: addToQueue | customScheduled | shareNow, dueAt, assets })`.
  The result is a union: always select both `PostActionSuccess` and `MutationError`. A
  `MutationError` arrives with HTTP 200, so a client that checks only the status reports
  success for a rejected post.
- **Media.** By public URL only; Buffer fetches it. Same need as Threads: an R2 object behind a
  public or presigned URL.
- **Limits.** Per API key or app client, by the _adopter's_ plan: 100 requests per 15 minutes
  on every plan, 250–500 per day, 3,000–15,000 per 30 days. With OAuth, every end user's
  requests count against the adopter's app client. A multi-user app must count its own calls
  and refuse before Buffer does; `429` carries `Retry-After`.
- **Idempotency.** None documented. Record the attempt before calling and never blind-retry a
  timeout, as with LinkedIn.
- **Overlap.** A user who connects both Bluesky directly and Bluesky through Buffer would post
  twice. The composer should show channels by network and warn on a duplicate.

**Verdict: small.** One GraphQL call per post, OAuth on the core we build anyway. The real work
is the rate-limit accounting and an honest error mapping.

### Not covered, for the record

- **X (Twitter).** Write access is paid and has changed terms repeatedly. A share intent (below)
  covers reader sharing, and Buffer covers scheduled posts to X.
- **Facebook and Instagram.** Business/creator accounts only, through Meta App Review. Same
  shape as Threads, larger review. Buffer reaches both without it.
- **Apple.** Sign-in only, already listed in the earlier note (JWT client secret,
  `response_mode=form_post`, private relay email).

## A zero-OAuth tier: share intents

Most "share this" buttons need no token at all. Each network has a URL that opens its composer
with text filled in:

| Network  | Intent URL                                                         |
| -------- | ------------------------------------------------------------------ |
| Bluesky  | `https://bsky.app/intent/compose?text=…`                           |
| Threads  | `https://www.threads.com/intent/post?text=…&url=…`                 |
| LinkedIn | `https://www.linkedin.com/sharing/share-offsite/?url=…` (URL only) |
| Mastodon | `https://<instance>/share?text=…` (the user's instance)           |
| X        | `https://x.com/intent/post?text=…&url=…`                           |

Plus `navigator.share()` where the platform has a share sheet. This is a few dozen lines and
no secrets, and it covers "let readers share this article". OAuth is needed only when the
**app** posts: scheduled posts, cross-posting, posting from a server.

**Decided: both.** `shareIntentUrl(network, { text, url })` in `@cascivo/app` (a pure function,
usable anywhere), and a `ShareMenu` registry component built on it:

- A trigger button that opens a Popover-API menu (the sanctioned dismissal path), one item per
  network, plus "Copy link" and, where `navigator.share` exists, the system share sheet.
- Mastodon asks for the instance once and remembers it with `@cascivo/storage`. The instance is
  normalized the same way as on the server, so no `javascript:` or path-bearing value reaches
  an `href`.
- `networks` prop (`items`-style collection per the vocabulary rule), labels from the
  `@cascivo/i18n` catalog, `clientJs: 'enhancement'`: without JavaScript the items are plain
  links that open the intents.
- Manifest, visual baselines in all three themes, and the usual gates.

## Design: one adapter, two uses

### Layers

```
@cascivo/app/oauth          protocol + provider adapters, runtime-agnostic
  ├─ authorize / callback / refresh / revoke   (state, PKCE, nonce, PAR, DPoP)
  ├─ verifyJwt (JWKS, RS256 + ES256)           (factored out of requireAccess)
  └─ providers: google, github, linkedin, mastodon(host), bluesky, threads

@cascivo/app/oauth-server   the Worker glue, on D1 (any `Database`)
  ├─ handleOAuth            sign-in → users, user_identities, sessions (as handleAuth)
  └─ handleConnections      "connect an account" → encrypted token vault

@cascivo/app/social         publishing clients, take a token set, know nothing of D1
  └─ bluesky, mastodon, linkedin, threads: prepare(text) → post(…)
```

The rule that makes the adapters reusable: **`oauth` and `social` import nothing from `db`,
`auth-server` or the cookie code.** They take `fetch`, a clock and a small storage interface
where they need one, and return plain data. A Node script, another framework's server or a
CLI can use them as they are. `oauth-server` is the only layer that knows about D1, cookies
and our `users` table.

### The adapter shape

```ts
interface OAuthProvider {
  id: 'google' | 'github' | 'linkedin' | 'mastodon' | 'bluesky' | 'threads'
  /** Per-user discovery (Mastodon instance, Bluesky handle); absent for fixed providers. */
  resolve?(input: string): Promise<ProviderEndpoints>
  /** Builds the redirect; returns what must be kept until the callback (state, verifier, nonce, DPoP key). */
  authorize(request: { redirectUri: string; scopes: readonly string[] }): Promise<Pending>
  /** Exchanges the code; verifies the ID token or DID binding; returns tokens and who it is. */
  callback(pending: Pending, params: URLSearchParams): Promise<{ tokens: TokenSet; identity: Identity }>
  refresh?(tokens: TokenSet): Promise<TokenSet>
  revoke?(tokens: TokenSet): Promise<void>
}

interface Identity {
  provider: string
  subject: string // stable: Google sub, GitHub id, DID, `${host}:${id}`
  email: string | null // only when the provider says it is verified
  name: string | null
  handle: string | null
  avatarUrl: string | null
}

interface TokenSet {
  accessToken: string
  refreshToken: string | null
  expiresAt: number | null // seconds; null = does not expire
  scopes: readonly string[]
  dpopKey?: JsonWebKey // Bluesky: the private key the tokens are bound to
  issuer: string // the authorization server, for Mastodon and Bluesky
}
```

`Identity.email` is `null` unless the provider asserts it is verified. The adapter makes that
decision once, so no caller can link accounts on an unverified address by mistake.

### Sign-in (`handleOAuth`)

The flow from item 6 of the earlier note, unchanged in substance:

- `state`, PKCE verifier, `nonce` and (Bluesky) the DPoP key go in a short-lived, HttpOnly,
  `SameSite=Lax` cookie, sealed with AES-GCM under a Worker secret. `Lax`, not `Strict`: the
  callback is a top-level redirect from another site, and `Strict` would drop the cookie.
- Redirect URIs come from configuration, never from the request. `returnTo` is checked to be
  a same-origin path.
- Link by `(provider, subject)` in a `user_identities` table. Attach to an existing user by
  email **only** when `identity.email` is set (that is, verified). Otherwise create a new user,
  and let a signed-in user link more providers from settings.
- Tokens are discarded after sign-in unless the adopter asked for a connection too.

**A schema change this forces.** `auth-server`'s `users.email` is `NOT NULL UNIQUE`, and the
browser `User` type has `email: string`. Mastodon, Bluesky (without the email scope) and
Threads users have no email. Options: make `email` nullable (SQLite needs a table rebuild in a
`cascivo_auth_0002` migration; `UNIQUE` still allows many `NULL`s), or require an email after
first sign-in. Nullable is the honest model; it is a type change on the public `User`, so it
needs a changeset that says so.

### Connected accounts (`handleConnections`)

For posting, the tokens are the product. A `connections` table:

```
connections (id, user_id, provider, subject, issuer, handle,
             scopes, expires_at, status, sealed_tokens, key_id, updated_at)
```

A Buffer connection is one row, with its Buffer channels cached beside it so the composer can
list them without a call per page view.

- **Encrypted, not hashed.** Sessions and sign-in links are stored as SHA-256 hashes because
  we only compare them. Provider tokens must be used, so they are sealed with AES-GCM: a key
  from a Worker secret, the connection id as additional data (a sealed blob copied to another
  row fails to open), `key_id` for rotation.
- **Separate consent.** Sign-in asks for identity scopes only. "Connect LinkedIn for posting"
  asks for `w_member_social` later, at the moment it is needed. A user who only signs in never
  sees a "post on your behalf" screen. LinkedIn, Bluesky and Mastodon all support asking for
  more scopes in a second authorization.
- **Refresh, by provider:**

  | Provider | What keeps a connection alive                                                 |
  | -------- | ----------------------------------------------------------------------------- |
  | Bluesky  | Refresh on use; **refresh tokens rotate**, so two concurrent refreshes kill the session |
  | Threads  | A scheduled job refreshes tokens older than ~30 days (window: 24 h to 60 days) |
  | LinkedIn | No refresh: email the user a reconnect link a week before `expires_at`        |
  | Mastodon | Nothing; a `401` sets `status = 'reconnect'`                                  |
  | Buffer   | Refresh on use (access 1 h); refresh tokens rotate, as Bluesky's              |
  | Google   | Refresh on use (access 1 h)                                                    |
  | GitHub   | OAuth App: nothing. GitHub App: refresh on use (8 h / 6 months)               |

- **The rotation race.** Two Workers refreshing one Bluesky or Buffer session at once is the subtle bug
  here: the loser's refresh token is already spent, and the user is disconnected. Guard the
  refresh with a conditional update (`UPDATE … SET sealed_tokens = ? WHERE id = ? AND
  updated_at = ?`); the loser re-reads the row and uses the winner's token. A Durable Object
  per connection is the heavier alternative.
- `status` (`active`, `expiring`, `reconnect`, `revoked`) is what a settings page shows, and
  what the publisher checks before it tries.

### Publishing (`social`)

One interface, honest about the differences:

```ts
interface SocialPost {
  text: string
  link?: { url: string; title?: string; description?: string; image?: Blob }
  images?: { data: Blob; alt: string }[]
}

interface Publisher {
  limits: { maxChars: number; countsGraphemes: boolean; urlWeight: number | null; maxImages: number }
  /** Network-specific text: facets (Bluesky), escaping (LinkedIn), length check. Throws a typed error. */
  prepare(post: SocialPost): Promise<PreparedPost>
  publish(tokens: TokenSet, post: PreparedPost, idempotencyKey: string): Promise<{ id: string; url: string }>
}
```

- `prepare` runs before anything is queued, so the composer can show "too long for Bluesky"
  while the user types, and a scheduled post that cannot be sent is refused up front (the
  same lesson as the newsletter's size check in #261).
- `publish` is called from a Workflow step (below). Idempotency per network: Mastodon's
  `Idempotency-Key`; Bluesky's client-chosen `rkey`; Threads' container id makes the publish
  step retryable. LinkedIn and Buffer have none: record the attempt before calling and never
  blind-retry a timeout.
- Buffer is one more `Publisher`, with a twist: its `publish` can hand the timing to Buffer
  (`mode: customScheduled` with `dueAt`, or `addToQueue`) instead of our Workflow waiting. The
  composer offers "schedule here" and "schedule in Buffer"; the second needs no Workflow at
  all.
- Link cards are the one place where we fetch arbitrary user URLs (Bluesky). Same rules as
  Mastodon hosts: `https`, timeouts, size caps, image type checks.

### The example that proves it: `--example social`

A small scheduler: compose once, pick networks (direct connections and Buffer channels), post
now or at a time, see the result per network with live progress through `jobs`. Images go
through `uploads`. Sign-in with Google, GitHub, LinkedIn, Mastodon or Bluesky, or with
`--auth email`. Connections are managed from settings. That is the "different context" the request asks for, and
it keeps the adapters honest: if posting needs a cookie from `handleOAuth`, the line between
layers is wrong.

### Infrastructure: Cloudflare only

Everything above maps onto what the Cloudflare scaffold already provisions or knows how to
(`d1_databases`, `r2_buckets`, `queues`, `workflows`, `triggers.crons` all exist in
`cascivo create --framework cloudflare` today). Nothing needs a server, Redis or a third-party
scheduler.

| Need                                  | Cloudflare piece                                                                 |
| ------------------------------------- | -------------------------------------------------------------------------------- |
| Users, identities, sessions           | D1, the tables `auth-server` already migrates, plus `user_identities`             |
| Connections, Mastodon registrations   | D1 (`connections`, `oauth_clients`); tokens sealed with AES-GCM                   |
| Sealing key, client secrets, ES256 key | Worker secrets (`OAUTH_SEALING_KEY`, `GOOGLE_CLIENT_SECRET`, `BLUESKY_PRIVATE_JWK`, …) |
| Pending authorization (state, PKCE)   | A sealed, short-lived cookie: no storage at all                                   |
| Bluesky client metadata and JWKS      | Served by the Worker at `/oauth/client-metadata.json` and `/oauth/jwks.json`      |
| Handle → DID over DNS                 | DNS-over-HTTPS to `cloudflare-dns.com`                                            |
| A scheduled post                      | One **Workflow** instance per post: `step.sleepUntil(dueAt)`, then one step per network, each retried on its own and never re-run once it succeeded |
| Threads refresh, LinkedIn reminder    | A daily **Cron Trigger** that selects connections by `expires_at`                 |
| Images for Threads and Buffer         | **R2**, exposed by a short-lived presigned URL (both fetch media by URL)          |
| Live progress in the composer         | `@cascivo/app/jobs` rooms (Durable Objects), as today                             |
| Rate limits (Mastodon connect, Buffer budget) | The Workers Rate Limiting binding behind `rateLimit` in `guard.ts`, and a D1 counter for Buffer's 30-day budget |
| Turnstile on "connect your instance"  | `verifyTurnstile`, already in `guard.ts`                                          |

Why a Workflow per post rather than a cron that scans for due posts: the sleep is exact rather
than "within a minute", a cancelled post is one `instance.terminate()`, and a post to four
networks where one fails retries only that network. Queues alone cap a delay at 24 hours, so
they cannot hold a post scheduled for next week.

## Testing

What can be proven in the container:

- A **mock authorization server** in the tests: discovery, PAR, a JWKS, ID tokens signed with a
  test key, DPoP proof checking with nonce rotation, refresh-token rotation. The Access tests in
  `guard.test.ts` already build a signing key and a JWKS this way.
- Bluesky identity resolution against fixed DID documents, including the hostile case: a DID
  whose document points to a different authorization server must be refused.
- Facet byte offsets with emoji and combining characters; LinkedIn escaping of every reserved
  character; Mastodon URL weighting.
- Buffer against a mock GraphQL endpoint: a `MutationError` with HTTP 200 is a failure, a `429`
  honours `Retry-After`, the budget counter refuses before Buffer does.
- The rotation race, with two refreshes run concurrently against one row.
- The scaffold under `vite dev` in workerd, signed in through the mock provider.

What needs real accounts: one round trip per provider, and one real post each to Bluesky,
Mastodon and LinkedIn test accounts, and one post through a Buffer free account. Threads needs a tester account on a Meta app. This joins
item 5 of the earlier note (the real-account smoke run).

## Recommended order

1. **Share intents** (S–M). `shareIntentUrl` and the `ShareMenu` component.
2. **`oauth` core + Google + GitHub + `handleOAuth`** (M). This is item 6 as proposed, with the
   adapter and storage split above, `verifyJwt` factored out of `requireAccess`, and the
   nullable-email migration. `--auth oauth` in the scaffold.
3. **LinkedIn** (S). Sign-in on the same OIDC path as Google; then `handleConnections` and the
   LinkedIn publisher as the first connected account (no refresh to get wrong, a clear
   reconnect rule).
4. **Mastodon** (M). Per-instance discovery and registration; publisher. `--example social`
   ships here with LinkedIn and Mastodon.
5. **Bluesky** (M–L). PAR, DPoP, identity resolution, the rotation guard, facets. The largest
   single item; worth its own PR.
6. **Buffer** (S). Personal key and OAuth; publisher; Buffer channels in the composer. Can move
   up to right after step 4 if reaching X and Instagram matters sooner: it needs only the
   OAuth core and `handleConnections`.
7. **Threads** (M). Publisher and the scheduled refresher. Ships last because no one can test it
   end to end without a reviewed Meta app.

Teams (item 7 of the earlier note) should come after step 2, since it builds on the same
identity model.

## Decisions

Taken 2026-10-03:

1. **Where the adapters live: `@cascivo/app`**, as subpaths (`oauth`, `oauth-server`,
   `social`). The rule that `oauth` and `social` import nothing from `db`, `auth-server` or the
   cookie code stays, and a test enforces it, so they remain usable outside a cascivo app.
2. **Bluesky: our own client.** No `@atproto/oauth-client`; `@cascivo/app` stays
   dependency-free.
3. **Email is optional.** `User.email` becomes `string | null`, on the server and in the
   browser `User`, through a `cascivo_auth_0002` migration that rebuilds `users`. A breaking
   type change, called out in the changeset. Email-only features (sign-in links, receipts,
   failed-renewal emails) check for an address and say why when there is none.
4. **Threads: posting only.** No "Sign in with Threads".
5. **Share: helper and component.** `shareIntentUrl` and a `ShareMenu` registry component.
6. **Buffer is in**, as a connected account and a publisher, with both the personal key and
   OAuth.
7. **Infrastructure is Cloudflare** wherever any is needed (see "Infrastructure: Cloudflare
   only").

## Sources

- Google: [OpenID Connect](https://developers.google.com/identity/openid-connect/openid-connect),
  [OAuth 2.0 for web server apps](https://developers.google.com/identity/protocols/oauth2/web-server)
- GitHub: [PKCE support for OAuth and GitHub App authentication](https://github.blog/changelog/2025-07-14-pkce-support-for-oauth-and-github-app-authentication/),
  [Authorizing OAuth apps](https://docs.github.com/en/apps/oauth-apps/building-oauth-apps/authorizing-oauth-apps)
- LinkedIn: [Sign In with LinkedIn using OpenID Connect](https://learn.microsoft.com/en-us/linkedin/consumer/integrations/self-serve/sign-in-with-linkedin-v2),
  [Posts API](https://learn.microsoft.com/en-us/linkedin/marketing/community-management/shares/posts-api),
  [Refresh tokens](https://learn.microsoft.com/en-us/linkedin/shared/authentication/programmatic-refresh-tokens)
- Mastodon: [OAuth](https://docs.joinmastodon.org/spec/oauth),
  [OAuth scopes](https://docs.joinmastodon.org/api/oauth-scopes),
  [apps](https://docs.joinmastodon.org/methods/apps)
- AT Protocol: [OAuth](https://atproto.com/specs/oauth),
  [Permissions](https://atproto.com/specs/permission)
- Buffer: [Quick start](https://developers.buffer.com/guides/getting-started.html),
  [Authentication](https://developers.buffer.com/guides/authentication.html),
  [Posts and scheduling](https://developers.buffer.com/guides/posts-and-scheduling.html),
  [Limits](https://developers.buffer.com/guides/api-limits.html)
- Cloudflare: [Workflows sleeping and retries](https://developers.cloudflare.com/workflows/build/sleeping-and-retrying/),
  [Queues delivery delay](https://developers.cloudflare.com/queues/configuration/batching-retries/)
- Threads: [Get started](https://developers.facebook.com/docs/threads/get-started),
  [Access tokens and permissions](https://developers.facebook.com/docs/threads/get-started/get-access-tokens-and-permissions)

## Status

**Step 2 implemented (2026-10-03):** the OAuth core, Google, GitHub and sign-in.

- `@cascivo/app/oauth`: `beginAuthorization` / `completeAuthorization` (state, PKCE S256,
  nonce), `google()` (ID token verified against Google's JWKS, `hostedDomain` checked on the
  token, optional `offline` + `refresh`), `github()` (numeric id, primary verified email only),
  `seal` / `unseal` (AES-256-GCM, HKDF per context). A test holds it to importing only the
  internal JWT module, so the adapters stay reusable outside the app layer.
- `@cascivo/app/oauth-server`: `handleOAuth`, on the same users and sessions as `handleAuth`,
  linking by `(provider, subject)` as designed above. Failures redirect with `?error=`.
- `requireAccess` and Google's ID tokens share one JWKS/RS256 verifier (`src/jwt.ts`).
- `User.email` is `string | null`. `cascivo_auth_0002` rebuilds `users` without renaming it
  (copy aside, drop, recreate, refill, with foreign keys deferred), because a rename rewrites
  every foreign key pointing at the table. Verified on SQLite and on local D1 (workerd): ids,
  sessions and an app's own foreign key to `users` survive.
- `cascivo create --auth oauth` and `--auth email,oauth`. `framework:check`'s checkout leg now
  uses `--auth email,oauth`.

Not proven without real credentials: a completed round trip at GitHub and at Google. Under
`vite dev` in workerd, everything up to the provider's consent page works, and so does a
refused code exchange against GitHub's real token endpoint.

The decision that `redirect URIs come from configuration, never from the request` became:
the request's origin by default, with an `origin` option to pin it. On Workers the host is
the routed hostname, the provider only accepts registered redirect URIs, and the state cookie
is host-only, so a different host fails the flow rather than leaking it.

**Step 3 implemented (2026-10-03):** LinkedIn, connected accounts, the LinkedIn publisher.

- `linkedin()` in `oauth`: OpenID Connect against `https://www.linkedin.com/oauth` (the live
  discovery document's issuer; the docs page says `https://www.linkedin.com`, so both are
  accepted). No PKCE (web apps use the secret); LinkedIn does not list `nonce` among its
  claims, so it is checked only when present. Google and LinkedIn share one ID-token check.
- `handleConnections`, `connectionTokens`, `listConnections`, `markReconnect` in
  `oauth-server`, on a `connections` table (`cascivo_connections_0001`). The design above said
  "conditional update, loser re-reads"; a test showed that is not enough. With single-use
  refresh tokens, the loser's refresh can fail **before** the winner has stored its result,
  and the loser then sees nothing new and gives up. Refreshing now takes a short lease on the
  row (`lease_until`), and other requests wait for the stored result without calling the
  provider. Key rotation (`key_id`) is not built: changing the secret marks connections
  `reconnect`.
- `@cascivo/app/social` with `linkedinPublisher()`: text, link card (with its own title and
  thumbnail; LinkedIn does not scrape), one image or many, `LinkedIn-Version: 202609`.
- The scaffold offers LinkedIn sign-in. Its `--example social` (connections UI, composer,
  Workflow per scheduled post, LinkedIn reconnect reminders) comes with step 4.

Not proven without real credentials: a LinkedIn sign-in and a post to a real feed.

**Step 4 implemented (2026-10-03):** Mastodon and `--example social`.

- `mastodon()` in `oauth`, a provider for many servers: `OAuthProvider.forServer(server,
  redirectUri)` discovers a server's endpoints and registers the app there once
  (`mastodonRegistrations` keeps registrations in D1, client secrets sealed), and the flow
  carries the server in its sealed state (`?server=` to start). PKCE and the `profile` scope
  where the server announces them, `read:accounts` before 4.3. `normalizeServer` and a
  hardened fetch (timeout, no redirects, 256 KB cap, token endpoint on the same host).
- `mastodonPublisher()` and `mastodonLength()` in `social`; `publish` takes an
  `idempotencyKey`. A connection records its `server`.
- `--example social` (brings `--auth oauth` unless another sign-in is given): connect
  LinkedIn and Mastodon, compose with each network's checks live, post now or schedule; one
  Workflow per post, one step per account. Run under `vite dev` in workerd: post-now, the
  reconnect path, scheduling and cancelling (the Workflow terminated) all behave. That run
  found that a Workflow refuses to `sleepUntil` a past time, so "post now" decides inside a
  step whether to sleep.
- Not built: LinkedIn reconnect **emails** (the page shows "expires soon" a week ahead
  instead), images in the example's composer (the publishers take them), and the Mastodon
  server's own character limit in the composer (500 is assumed).

Not proven without real accounts: a post to a real LinkedIn feed and to a real Mastodon
server.

**Step 5 implemented (2026-10-03):** Bluesky, our own client (decision 2).

- `bluesky()` in `oauth`: handle or DID → DID document → PDS → authorization server, then PAR,
  PKCE and DPoP (internal `dpop.ts`: ES256 proofs, the nonce retry), `iss` checked, `sub`
  checked against the DID resolved for the flow. Loopback, public and confidential clients;
  `blueskyClientMetadata`, `blueskyJwks`, `parseBlueskyKey`. The provider interface grew
  `dpop`, an async `authorizationUrl`, `server` on a resolved provider, and the callback
  parameters in `exchange`; `TokenSet.dpop` carries the binding.
- `blueskyPublisher()` in `social`: graphemes, facets at UTF-8 byte offsets (mentions
  resolved on the account's PDS), link cards from the given title, images. Idempotency as
  designed above, with one addition: the record key is a TID fixed by `createdAt` and the
  idempotency key, and a retry first looks the record up, since `createRecord` gives no
  documented error code for a taken key.
- Tests run against a fake network whose servers verify every DPoP proof and client
  assertion with Node's own crypto, and include the hostile cases (a DID document claiming
  another handle, metadata naming another issuer, a token endpoint elsewhere, tokens for
  another DID). Live, from `vite dev`: `@bsky.app` resolved through real DNS and PLC, and
  Bluesky's real server accepted the pushed request and served its authorize page.
- `--example social` connects Bluesky; the Worker serves the client metadata (and the key
  set, with `BLUESKY_PRIVATE_JWK`).
- Not done: granular scopes (the default stays `atproto transition:generic`, which every
  server accepts); reading the account's display name.

**Step 6 implemented (2026-10-03):** Buffer.

- `buffer()` in `oauth` (PKCE, consent, offline access, rotating refresh tokens under the
  lease) and `bufferQuery`, which reads GraphQL errors sent with a 200 and `Retry-After`. A
  connection is the account's first Buffer organization: the documented query is
  `account { organizations { id name } }`, and nothing documented names the account itself.
- `bufferPublisher`, `bufferChannels`, `bufferTokens` in `social`. Inputs are written inline
  and JSON-encoded rather than as typed variables, so nothing depends on schema type names the
  docs do not show. `PublishedPost.url` became nullable, `PublishError` gained `retryAfter`.
- `--example social`: each Buffer channel is an account (`<connection>~<channel>`), checked
  against its network's limit; channel lists are kept in D1 for an hour; Buffer steps are never
  retried. Live from `vite dev`, Buffer's API refused a planted token with a 401 and
  `UNAUTHENTICATED`, which became `reconnect` on the connection and a readable failure on the
  post.
- Not done: the D1 request-budget counter proposed above (Buffer enforces the budget and the
  429 is surfaced instead), and "schedule in Buffer" in the example's composer (the Workflow
  waits and Buffer shares now; `bufferPublisher` supports both).

**Step 7 implemented (2026-10-03):** Threads (decision 4: posting only).

- `threads()` in `oauth`: authorize at `www.threads.com` (the bare host answers with a 301), code and
  long-lived exchange and the profile at `graph.threads.com` (`graph.threads.net` answers the
  same; Meta's pages name both). No PKCE, client secret; scopes comma-separated.
- No refresh token, so the provider declares `refreshAhead` (30 days). `connectionTokens`
  renews such a token in its window, never waits on another request doing so (the current
  token still works), and keeps the working token when the renewal fails. Such a connection
  stays "not refreshable", so a token that never renews shows `expiring` in its last week, then
  `reconnect`. `refreshConnections` renews all due connections; the example calls it from a
  daily Cron Trigger that shares the `scheduled` handler with the digest.
- `threadsPublisher` in `social`: text with `link_attachment`, one image, or a carousel
  (children first, each waited on), then `threads_publish` and a permalink lookup that cannot
  turn a published post into a failure. `alt_text` is sent (up to 1000 characters).
  `threadsLength` counts an emoji by its UTF-8 bytes, as Meta documents.
- Live, against Meta with a planted token: refresh refused with `Cannot parse access token`
  (`provider_error`), the code exchange refused `Invalid client_id`, and publishing answered
  401, which became `reconnect`. Not tried: a real account (Meta's tester role on an app).

**Gaps closed after step 7 (2026-10-03):**

- Bluesky display name and avatar: read from the profile record on the account's PDS
  (`com.atproto.repo.getRecord`, public), the avatar as the PDS's `getBlob` URL rather than an
  app view's CDN. Live: `@bsky.app` resolved to "Bluesky", and its blob served `image/jpeg`.
- Mastodon's per-server limits: `mastodonServerLimits` reads `/api/v2/instance`
  (`max_characters`, `max_media_attachments`, `characters_reserved_per_url`), each accepted
  within a sane range. Live: hachyderm.io allows 2263 characters. The example keeps them in D1
  for a day, and checks against them in the page and again in the Workflow.
- "Schedule in Buffer" in the example: a scheduled post can hand its Buffer accounts over at
  once (`createdAt` ahead, so `bufferPublisher` sends `customScheduled`). They wait in
  Buffer's queue as `queued`; cancelling the post here does not withdraw them, and the page
  says so.
- The Buffer request budget: counted in D1 per 15-minute window as the app spends it, shown on
  the page, and channel lists stop refreshing with fewer than 20 requests left. Buffer still
  enforces the real budget; its 429 is surfaced as before.

- LinkedIn reconnect reminders: `expiringConnections` lists, across users, the connections that
  cannot renew and end within a week, with the owner's email. The example's daily Cron Trigger
  emails each owner once per token (keyed by its expiry, recorded after sending) through Email
  Service. Live in workerd: one email for the token ending in 3 days, none for the one ending in
  30, and none on the second run.
