---
'@cascivo/charts': patch
'@cascivo/tokens': patch
---

Fix CSS custom properties that resolved to nothing, and complete the token catalog.

18 shipped `var(--cascivo-…)` reads referenced properties that are declared nowhere and had
no fallback, so the declaration silently did not apply — `--cascivo-text-secondary`,
`--cascivo-color-danger`, `--cascivo-font-size-sm`, `--cascivo-color-neutral-200` and
friends, all near-misses for a real token. Affected shipped CSS across components, layouts
and two charts (`Bullet`'s range fills and `Heatmap`'s `color-mix` base).

`tokens.catalog.json` — advertised as a closed set — was generated from the token and theme
stylesheets only, so every per-component knob was invisible to anyone validating against it.
It now includes component-declared tokens and author hooks: 266 → 317 entries.
