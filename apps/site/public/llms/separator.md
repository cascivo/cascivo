# Separator

Visual or semantic divider between content

## Install

Copy-paste the source (you own and can edit it):

```bash
npx cascivo add separator
```

Or use it from the prebuilt package without copying:

```tsx
import { Separator } from '@cascivo/react'
```

## Category

`display`

## Props

| Prop          | Type                         | Required | Default      | Description                                                              |
| ------------- | ---------------------------- | -------- | ------------ | ------------------------------------------------------------------------ |
| `orientation` | `'horizontal' \| 'vertical'` | no       | `horizontal` | Layout orientation of the component.                                     |
| `decorative`  | `boolean`                    | no       | `false`      | When true, the separator is purely visual and hidden from assistive tech |

## Examples

### Horizontal

```tsx
<Separator />
```

### Vertical

```tsx
<Separator orientation="vertical" />
```

## Design tokens

- `--cascivo-color-border`

## Accessibility

- **WCAG level:** 2.2-AA
- **ARIA role:** `separator`

## Dependencies

- `@cascivo/core`

## Tags

divider, rule, layout

---

_Generated from registry v0.10.1 on 2026-07-23. Docs track `main`; compare with https://cascivo.com/registry.json `.version`._
