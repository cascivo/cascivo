# Skeleton

Animated loading placeholder that mirrors the shape of pending content

## Install

Copy-paste the source (you own and can edit it):

```bash
npx cascivo add skeleton
```

Or use it from the prebuilt package without copying:

```tsx
import { Skeleton } from '@cascivo/react'
```

## Category

`display`

## Variants

- `text`
- `circle`
- `rect`

## Props

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `variant` | `'text' \| 'circle' \| 'rect'` | no | `text` | Selects the visual style variant. |
| `width` | `string` | no | — | CSS length applied as an inline custom property |
| `height` | `string` | no | — | CSS length applied as an inline custom property |
| `lines` | `number` | no | `1` | Number of bars for the text variant; the last bar renders shorter |

## Examples

### Text

```tsx
<Skeleton lines={3} />
```

### Avatar

```tsx
<Skeleton variant="circle" width="3rem" height="3rem" />
```

### Image

```tsx
<Skeleton variant="rect" height="12rem" />
```

## Design tokens

- `--cascivo-color-border`
- `--cascivo-color-bg-subtle`
- `--cascivo-radius-sm`
- `--cascivo-radius-full`
- `--cascivo-radius-component`

## Accessibility

- **WCAG level:** 2.2-AA
- **ARIA role:** `none`

## Dependencies

- `@cascivo/core`

## Tags

loading, placeholder, shimmer

---

_Generated from registry v0.8.0 on 2026-07-21. Docs track `main`; compare with https://cascivo.com/registry.json `.version`._
