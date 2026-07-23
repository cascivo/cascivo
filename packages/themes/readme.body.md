First-party themes for cascivo — {{count.themes}} of them, applied with a single `data-theme` attribute. Themes override the **semantic token layer only**, leaving primitive and component tokens unchanged, so every component (and your own token-consuming CSS) restyles for free.

> **Docs offline?** The full cascivo reference (including the theming guide) ships as an npm package — `npx -y @cascivo/docs guide theming`, no website needed.

## The themes

`light` · `dark` · `warm` · `flat` · `minimal` · `midnight` · `pastel` · `brutalist` · `corporate` · `terminal` · `cyberpunk` · `arcade`

## Import options

**Everything (recommended starting point):**

```ts
import '@cascivo/themes/all.css' // tokens (once) + base typography + light & dark
```

**À la carte** — each theme sheet self-imports `@cascivo/tokens` (deduped by URL, so multiple themes load tokens once). Import only what you ship:

```ts
import '@cascivo/themes/base.css' // base typography layer (font, line-height, color)
import '@cascivo/themes/light.css'
import '@cascivo/themes/dark.css'
import '@cascivo/themes/midnight.css' // …any of the {{count.themes}} themes by name
```

Every export also works with an explicit `.css` suffix (`@cascivo/themes/light.css`) for tooling that requires it.

**Tailwind interop:** `@cascivo/themes/tailwind` is a bridging sheet (not a theme) that maps cascivo tokens onto Tailwind theme variables — see [docs/USING-WITH-TAILWIND.md](https://github.com/cascivo/cascivo/blob/main/docs/USING-WITH-TAILWIND.md).

## Scoping with `data-theme`

Apply a theme to the whole app or to any container — themes nest, so a dashboard can be `dark` while a preview pane inside it is `light`:

```html
<body data-theme="dark">
  ...
  <section data-theme="light"><!-- locally light --></section>
</body>
```

Only themes whose CSS you imported are available; the attribute value must match the theme name.

## Per-theme fonts

A theme can carry its own **display** (headline/brand) face via `--cascivo-font-display`. The token defaults to `var(--cascivo-font-sans)` (so themes that don't override it look unchanged) and is declared in every theme to keep token parity. The `Heading` component renders in the display face, so an override is visible wherever headings appear — e.g. `terminal` maps it to the mono stack and `brutalist` to a heavy grotesk. `--cascivo-font-sans`/`-mono` remain the global body/code defaults.

## Custom themes & branding

To match a brand, override semantic `--cascivo-*` custom properties in your own CSS (or generate a full theme with the `create_theme` MCP tool / `cascivo` CLI). The layer cascade, the `data-theme` specificity footgun, per-role radius/control-height tokens, and a starter theme are covered in [docs/THEMING.md](https://github.com/cascivo/cascivo/blob/main/docs/THEMING.md).
