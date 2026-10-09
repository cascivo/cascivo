---
'@cascivo/themes': patch
'@cascivo/tokens': patch
'@cascivo/react': patch
---

Accessibility fixes found by the workbench's axe sweep:

- **Themes:** the static `--cascivo-color-text-on-destructive` / `--cascivo-color-text-on-accent` fallbacks of dark (destructive), midnight (both) and pastel (accent) were white on a light fill, below 3:1. Browsers without `contrast-color()` painted them; they are now dark ink, which is also what `contrast-color()` picks. A new check holds every theme's fallback to AA on its fill.
- **Tokens:** `--cascivo-link-color` is declared on `[data-theme]` as well as `:root`, so a Link inside a scoped theme uses that theme's accent instead of the root theme's (3.67:1 on dark).
- **Calendar:** each day is a `<button role="gridcell">` inside a presentational `<td>`, so `aria-selected` stays on the focused element and on a role ARIA allows it on. Tests that queried days by role `button` query `gridcell`.
