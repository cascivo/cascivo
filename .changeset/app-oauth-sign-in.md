---
'@cascivo/app': minor
---

Sign in with GitHub or Google: two new entries.

- `@cascivo/app/oauth` — the authorization-code flow (`beginAuthorization`,
  `completeAuthorization`) with `state`, PKCE (S256) and an OpenID `nonce`, and adapters:
  `google()` verifies the ID token against Google's keys (issuer, audience, expiry, nonce, and
  `hostedDomain` on the token), `github()` reads `/user` and only a primary, verified email.
  `seal` / `unseal` encrypt a value (AES-256-GCM, a key derived per context) for a cookie or a
  stored token. No database, cookie or Worker code: the adapters work anywhere `fetch` and
  WebCrypto do, so the tokens can be kept to call the provider's API.
- `@cascivo/app/oauth-server` — `handleOAuth(db, { providers, secret })` answers
  `/api/auth/oauth/<id>` and its callback on the same users and sessions as `handleAuth`, so the
  two share one sign-in page and `requireUser`. A user is found by `(provider, subject)`; a new
  identity joins the signed-in user, else the user with the same verified email, else a new
  user. Failures redirect to a page with `?error=`.

The browser `createAuth()` gains `providers()` and `signInUrl(provider, returnTo?)`.

**Type change:** `User.email` (from `@cascivo/app/auth` and `@cascivo/app/auth-server`) is now
`string | null`, since a provider may share no verified address. Code that reads it as a
`string` needs a check. Users who signed in by email link always have one. The `users` table
is rebuilt once to drop `NOT NULL` from `email` (migration `cascivo_auth_0002`, applied on the
first request as before); ids, sessions and your own foreign keys to `users` are kept.

`requireAccess` now verifies through the same JWKS code as Google's ID tokens; its behaviour
and messages are unchanged.
