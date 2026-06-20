A three-level system of CSS custom properties that every cascivo component, theme, and chart reads from.

```
Primitive  --cascivo-color-blue-500: #3b82f6         the raw scale
    ↓
Semantic   --cascivo-color-accent: var(--…-blue-500)  intent (themes remap this layer)
    ↓
Component  --cascivo-button-bg: var(--…-accent)       usage (override per-brand)
```

## Usage

Import once at your app entry — or get tokens for free via `@cascivo/themes`, which self-imports this package:

```ts
import '@cascivo/tokens'
```

Then reference tokens anywhere in your CSS:

```css
.cta {
  background: var(--cascivo-color-accent);
  padding-block: var(--cascivo-space-3);
  border-radius: var(--cascivo-radius-md);
}
```

## How the layers compose

- **Primitive** tokens define the raw palette, spacing, radius, and type scales. They never change between themes.
- **Semantic** tokens map intent (`--cascivo-color-accent`, `--cascivo-color-surface`). [`@cascivo/themes`](https://github.com/cascivo/cascivo/tree/main/packages/themes) overrides **only** this layer via `data-theme`.
- **Component** tokens map usage (`--cascivo-button-bg`). Override these to adapt a single component to your brand — no rebuild, no theme fork.

A machine-readable catalog of every token, its layer, and its resolved default ships as `tokens.catalog.json`, so AI agents select from a closed set rather than inventing values.
