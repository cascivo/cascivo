---
'@cascivo/themes': patch
'@cascivo/tokens': patch
'@cascivo/react': patch
'@cascivo/email': patch
---

Contrast fixes from a workbench axe sweep across all twelve themes: 101 findings in 7 themes before, 0 of 3060 checks after. Lightness only; hue and chroma are unchanged.

- **Text on a fill:** pastel `--cascivo-color-primary-fg`, `--cascivo-color-accent-foreground` and `--cascivo-color-info-content`, midnight `--cascivo-color-accent-foreground` were white on a light fill (2.9–3.2:1); now dark ink. Primary buttons and info Badges in pastel, and Calendar's selected day in midnight, were the visible cases.
- **Secondary text:** `--cascivo-color-foreground-muted` (and `--cascivo-color-text-subtle`, which points at it) darkened in pastel and minimal, so card, table, alert and form help text clears AA on every surface.
- **Status ink:** `--cascivo-color-success-foreground` darkened in arcade, brutalist and flat (Badge, Alert titles); `--cascivo-color-destructive` darkened in pastel and lightened in cyberpunk, since 47 component rules use it as text.
- **Code syntax:** `--cascivo-editor-syntax-keyword` and `-tag`, and CodeSnippet's keyword colour, read `--cascivo-color-accent-text` instead of the raw accent, which in warm, brutalist and pastel is a fill hue (1.4–2.9:1 as text).

`accent-text-contrast` now holds every one of these token pairs to AA in every theme.

`@cascivo/email`'s generated palettes follow the theme values.
