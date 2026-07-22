# Text

Body text with size, weight, and muted variants

## Install

Copy-paste the source (you own and can edit it):

```bash
npx cascivo add text
```

Or use it from the prebuilt package without copying:

```tsx
import { Text } from '@cascivo/react'
```

## Category

`display`

## Variants

- `normal`
- `medium`
- `semibold`

## Sizes

- `sm`
- `md`
- `lg`

## Props

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `as` | `'p' \| 'span' \| 'div'` | no | `p` | The HTML element to render as. |
| `size` | `'sm' \| 'md' \| 'lg'` | no | `md` | Visual size of the component (e.g. 'sm', 'md', 'lg'). |
| `weight` | `'normal' \| 'medium' \| 'semibold'` | no | `normal` | Font weight ('normal' \| 'medium' \| 'semibold'). |
| `muted` | `boolean` | no | `false` | When true, renders in a muted/subtle color. |

## Examples

### Default

```tsx
<Text>Body copy reads at the base size.</Text>
```

### Muted helper

```tsx
<Text size="sm" muted>Secondary information</Text>
```

### Inline span

Use as="span" inside other flow content

```tsx
<Text as="span" weight="semibold">emphasis</Text>
```

## Design tokens

- `--cascivo-font-sans`
- `--cascivo-font-normal`
- `--cascivo-font-medium`
- `--cascivo-font-semibold`
- `--cascivo-leading-normal`
- `--cascivo-color-text`
- `--cascivo-color-text-subtle`
- `--cascivo-text-sm`
- `--cascivo-text-base`
- `--cascivo-text-lg`

## Accessibility

- **WCAG level:** 2.2-AA
- **ARIA role:** `paragraph`

## Dependencies

- `@cascivo/core`

## Tags

typography, text, paragraph, body

---

_Generated from registry v0.9.0 on 2026-07-22. Docs track `main`; compare with https://cascivo.com/registry.json `.version`._
