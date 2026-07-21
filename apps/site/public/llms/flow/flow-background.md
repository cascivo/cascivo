# FlowBackground

Decorative dots / grid / cross canvas background, drawn purely in CSS gradients.

## Install

Ships in the `@cascivo/flow` package — install it (no copy-paste):

```sh
pnpm add @cascivo/flow
```

```tsx
import { FlowBackground } from '@cascivo/flow'
import '@cascivo/flow/styles.css' // required stylesheet
```

## Category

`display`

## Variants

- `dots`
- `grid`
- `cross`

## Props

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `variant` | `'dots' \| 'grid' \| 'cross'` | no | `dots` | Pattern style. |
| `gap` | `number` | no | `20` | Cell spacing (px). |
| `size` | `number` | no | `1` | Dot radius / line thickness (px). |
| `color` | `string` | no | — | Pattern color (defaults to the border token). |
| `className` | `string` | no | — | Additional CSS class names merged onto the root element. |

## Examples

### Dotted background

A dotted grid behind a flow canvas.

```tsx
() => (
  <div style={{ position: 'relative', height: 220, overflow: 'hidden' }}>
    <FlowBackground variant="dots" gap={24} />
  </div>
)
```

### Grid and cross

The grid and cross variants.

```tsx
() => (
  <div style={{ display: 'grid', gap: 16, gridTemplateColumns: '1fr 1fr' }}>
    <div style={{ position: 'relative', height: 180, overflow: 'hidden' }}>
      <FlowBackground variant="grid" gap={28} />
    </div>
    <div style={{ position: 'relative', height: 180, overflow: 'hidden' }}>
      <FlowBackground variant="cross" gap={28} size={4} />
    </div>
  </div>
)
```

## Design tokens

- `--cascivo-color-border`

## Accessibility

- **WCAG level:** 2.1-AA
- **ARIA role:** `presentation`

## Dependencies

- `@cascivo/core`

## Tags

flow, background, grid, dots, canvas

---

_Generated from registry v0.8.0 on 2026-07-21. Docs track `main`; compare with https://cascivo.com/registry.json `.version`._
