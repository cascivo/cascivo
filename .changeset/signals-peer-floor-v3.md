---
'@cascivo/core': patch
'@cascivo/react': patch
'@cascivo/charts': patch
'@cascivo/storage': patch
'@cascivo/i18n': patch
'@cascivo/ai': patch
'@cascivo/editor': patch
'@cascivo/flow': patch
'cascivo': patch
---

Raise the `@preact/signals-react` peer floor from `>=2.0.0` to `>=3.0.0`.

React 19 removed the internal export that signals-react 2.x imports, so a 2.x
runtime fails to load under React 19 (`SyntaxError: … '__SECRET_INTERNALS…'`). The
old `>=2` floor let a resolver pick that broken build. signals-react 3.x still
supports React 16.14+/17/18, so the new floor costs React-18 users nothing.

If a lockfile carried over from an earlier install pins signals-react 2.x, run
`cascivo doctor` — it now flags the mismatch (error on React 19, warning on React 18)
with the exact upgrade command.
