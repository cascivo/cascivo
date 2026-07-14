---
'cascivo': minor
---

`cascivo audit` gains two layer-discipline rules (both `warn`, never fail the
build): `unlayered-css` flags top-level CSS rules outside any `@layer` block
(accessibility-guarantee media queries like `forced-colors` are exempt), and
`vendor-css-import` flags bare `*.css` imports from `node_modules` that can't be
layered — pointing you at the `@import url(…) layer(vendor)` recipe. A new
`pnpm unlayered:check` guards shipped CSS against the same trap in CI.
