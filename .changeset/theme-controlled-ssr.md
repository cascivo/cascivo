---
'@cascivo/react': minor
---

A controlled `<ThemeProvider value={…}>` is now SSR-safe on its own.

Previously the provider wrote `data-theme` only in a client effect, so a controlled
provider emitted no theme attribute during SSR and the first paint was unthemed until
hydration (a FOUC). When the theme is decided by server state, the provider now renders a
tiny inline script that sets `data-theme` during HTML parsing — themed first paint, no
hydration mismatch (the same markup renders on both sides; the client effect owns every
update after hydration). Values are escaped against `</script>` breakout, and a new
`nonce` prop forwards a CSP nonce to the script. The uncontrolled/persisted flow still
uses `themePreloadScript()` in `<head>`, and `target`-scoped providers are unchanged.
