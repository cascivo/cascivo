---
'@cascivo/app': minor
'cascivo': minor
'@cascivo/mcp': minor
---

Who may call the Worker: `@cascivo/app/guard`.

- `requireAccess(request, { teamDomain, audience })` verifies the JWT Cloudflare Access signs:
  the RS256 signature against the team's published keys, the issuer, the audience and the
  expiry. It refuses a request that reached the Worker around Access with a 403, and every
  request with a 500 until the team domain and audience are set.
- `verifyTurnstile(token, { secret })` checks a Turnstile token with siteverify (403 on
  failure). `mountTurnstile` from `@cascivo/app/turnstile` renders the widget.
- `rateLimit(limiter, key)` counts a call against the Rate Limiting binding (429 past the
  limit). `clientIp` and `guardResponse` help at the top of `fetch`.
- `cascivo create --framework cloudflare --auth access` makes the Worker refuse every request
  Access did not let through. `vite dev` skips the check. The MCP tool `create_app` accepts
  `auth: 'access'`.
- `--example files` and `--example export` now rate-limit starting an upload or an export:
  20 a minute per IP.
