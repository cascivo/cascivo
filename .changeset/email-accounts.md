---
'@cascivo/app': minor
'cascivo': minor
'@cascivo/mcp': minor
---

Accounts with passwordless sign-in.

- `@cascivo/app/auth-server`:
  - `handleAuth(db, { sendLink })` answers `/api/auth/start`, `/verify`, `/me` and `/signout`.
  - Users, one-time links and sessions live in D1, stored as SHA-256 hashes.
  - A link works once, for 15 minutes, and opens a page, so a mail scanner cannot use it up.
  - The session is a `__Host-` cookie: HttpOnly, Secure, SameSite=Lax.
  - `requireUser` answers 401 when signed out, and 403 for a write from another site.
- `@cascivo/app/auth`: `createAuth()` gives `user` as a signal, plus `start`, `verify` and
  `signOut`.
- `cascivo create --framework cloudflare --auth email` scaffolds an Account page and the link
  page.
  - Every API write needs a signed-in user; reads stay public.
  - Sign-in emails are rate-limited per IP.
  - `vite dev` shows the link instead of sending it.
- The MCP tool `create_app` accepts `auth: 'email'`.
