# Tag

Compact chip for labeling, categorizing, or filtering content

## Install

Copy-paste the source (you own and can edit it):

```bash
npx cascivo add tag
```

Or use it from the prebuilt package without copying:

```tsx
import { Tag } from '@cascivo/react'
```

## Category

`display`

## Variants

- `default`
- `info`
- `success`
- `warning`
- `error`

## Sizes

- `sm`
- `md`

## Props

| Prop           | Type                                                       | Required | Default   | Description                                                     |
| -------------- | ---------------------------------------------------------- | -------- | --------- | --------------------------------------------------------------- |
| `variant`      | `'default' \| 'info' \| 'success' \| 'warning' \| 'error'` | no       | `default` | Selects the visual style variant.                               |
| `size`         | `'sm' \| 'md'`                                             | no       | `md`      | Visual size of the component (e.g. 'sm', 'md', 'lg').           |
| `onDismiss`    | `() => void`                                               | no       | —         | When provided, renders a trailing remove button inside the chip |
| `dismissLabel` | `string`                                                   | no       | `Remove`  | Accessible label for the dismiss button.                        |

## Examples

### Default

```tsx
<Tag>Design</Tag>
```

### Success

```tsx
<Tag variant="success">Approved</Tag>
```

### Dismissible

Renders a trailing remove button labeled by dismissLabel

```tsx
<Tag onDismiss={() => removeFilter()}>Filter: Active</Tag>
```

## Design tokens

- `--cascivo-color-bg-subtle`
- `--cascivo-color-text-subtle`
- `--cascivo-color-info`
- `--cascivo-color-info-subtle`
- `--cascivo-color-success`
- `--cascivo-color-success-subtle`
- `--cascivo-color-warning`
- `--cascivo-color-warning-subtle`
- `--cascivo-color-destructive`
- `--cascivo-color-destructive-subtle`
- `--cascivo-radius-badge`
- `--cascivo-focus-ring`

## Accessibility

- **WCAG level:** 2.2-AA
- **ARIA role:** `none`
- **Keyboard:** Enter, Space

## Dependencies

- `@cascivo/core`
- `@cascivo/i18n`

## Tags

chip, label, filter, category

---

_Generated from registry v0.8.0 on 2026-07-21. Docs track `main`; compare with https://cascivo.com/registry.json `.version`._
