---
'@cascivo/tokens': minor
'@cascivo/themes': minor
'@cascivo/react': minor
'cascivo': patch
---

Ship one canonical CSS `@layer` order and a real override escape hatch.

The layer order was previously restated in several places that disagreed on whether
`theme` or `component` wins, so overriding tokens behaved differently depending on
which stylesheet loaded first. Now a single authoritative statement —
`@layer cascivo.reset, cascivo.base, cascivo.tokens, cascivo.component, cascivo.theme, cascivo.override;`
— ships from `@cascivo/tokens/layers.css` and is emitted first by every entry path
(`@cascivo/tokens`, `@cascivo/themes/all`, and the `@cascivo/react` aggregate
`styles.css`).

- New top-most `cascivo.override` layer: put brand/one-off overrides in
  `@layer cascivo.override { … }` and they beat tokens, components, and themes with
  no `:root:not([data-theme])` specificity fight.
- New export `@cascivo/tokens/layers.css`.
- The CLI scaffold (`cascivo create`) now emits the canonical order (adds
  `cascivo.base` and `cascivo.override`).

Behavior note: the `@cascivo/themes/all` bundle now makes `theme > component`
explicit (previously implied `component > theme` via import order). This only affects
a consumer who relied on a component redefining a semantic token in
`@layer cascivo.component` and winning over the active theme — an anti-pattern under
cascade's "themes own the semantic tier" model. No token values changed.
