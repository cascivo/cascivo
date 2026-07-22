# Blockquote

Quoted passage with optional attribution footer

## Install

Copy-paste the source (you own and can edit it):

```bash
npx cascivo add blockquote
```

Or use it from the prebuilt package without copying:

```tsx
import { Blockquote } from '@cascivo/react'
```

## Category

`display`

## Props

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `cite` | `string` | no | `undefined` | URL of the quote’s source (sets the HTML cite attribute). |

## Examples

### Default

```tsx
<Blockquote>Less, but better.</Blockquote>
```

### With attribution

Attribution renders as <footer><cite>

```tsx
<Blockquote cite="Dieter Rams">Less, but better.</Blockquote>
```

## Design tokens

- `--cascivo-color-border-strong`
- `--cascivo-color-text`
- `--cascivo-color-text-subtle`
- `--cascivo-font-sans`
- `--cascivo-font-medium`
- `--cascivo-leading-relaxed`
- `--cascivo-text-sm`
- `--cascivo-text-base`

## Accessibility

- **WCAG level:** 2.2-AA
- **ARIA role:** `blockquote`

## Dependencies

- `@cascivo/core`

## Tags

typography, quote, blockquote, citation

---

_Generated from registry v0.9.0 on 2026-07-22. Docs track `main`; compare with https://cascivo.com/registry.json `.version`._
