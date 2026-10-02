---
'@cascivo/themes': patch
---

Every theme now restates `--cascivo-radius-field`, `--cascivo-radius-item` and
`--cascivo-radius-overlay` from its own `--cascivo-radius-base`. Those three are derived in
`@cascivo/tokens` on `:root`, so a theme scoped to a subtree (`<div data-theme="brutalist">`)
left them at the root's 6px: nav rows, segmented-control segments and popovers stayed rounded
inside a zero-radius theme.
