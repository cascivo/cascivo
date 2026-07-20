# Card

Container for grouping related content

## Install

Copy-paste the source (you own and can edit it):

```bash
npx cascivo add card
```

Or use it from the prebuilt package without copying:

```tsx
import { Card } from '@cascivo/react'
```

## Category

`display`

## Variants

- `default`
- `outlined`
- `elevated`

## Props

| Prop      | Type                                    | Required | Default   | Description                       |
| --------- | --------------------------------------- | -------- | --------- | --------------------------------- |
| `variant` | `'default' \| 'outlined' \| 'elevated'` | no       | `default` | Selects the visual style variant. |
| `padding` | `'none' \| 'sm' \| 'md' \| 'lg'`        | no       | `md`      | Inner padding of the component.   |

## Examples

### Basic card

```tsx
<Card>
  <CardHeader>
    <CardTitle>Title</CardTitle>
  </CardHeader>
  <CardContent>Content here</CardContent>
</Card>
```

## Design tokens

- `--cascivo-color-surface`
- `--cascivo-color-border`
- `--cascivo-radius-card`
- `--cascivo-shadow-md`

## Accessibility

- **WCAG level:** 2.2-AA
- **ARIA role:** `region`

## Dependencies

- `@cascivo/core`

## Tags

container, layout, surface

---

_Generated from registry v0.8.0 on 2026-07-20. Docs track `main`; compare with https://cascivo.com/registry.json `.version`._
