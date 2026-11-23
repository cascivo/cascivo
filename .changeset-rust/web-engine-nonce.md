---
"cascivo-web": patch
---

`Engine`: `theme_script()` and `islands_script()` add `nonce="…"` from the request's `ReqCtx::nonce` (inline or `[build] external_scripts`), so a strict `script-src 'nonce-…'` CSP admits them. The static build has no nonce and is unchanged.
