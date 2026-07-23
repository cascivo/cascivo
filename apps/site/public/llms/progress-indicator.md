# ProgressIndicator

Shows progress through the steps of a multi-step flow

## Install

Copy-paste the source (you own and can edit it):

```bash
npx cascivo add progress-indicator
```

Or use it from the prebuilt package without copying:

```tsx
import { ProgressIndicator } from '@cascivo/react'
```

## Category

`navigation`

## Variants

- `horizontal`
- `vertical`

## States

- `complete`
- `current`
- `incomplete`

## Props

| Prop           | Type                                        | Required | Default | Description                                              |
| -------------- | ------------------------------------------- | -------- | ------- | -------------------------------------------------------- |
| `steps`        | `{ label: string; description?: string }[]` | yes      | —       | Ordered list of steps                                    |
| `currentIndex` | `number`                                    | yes      | —       | Index of the current step (0-based)                      |
| `vertical`     | `boolean`                                   | no       | `false` | When true, lays the steps out vertically.                |
| `className`    | `string`                                    | no       | —       | Additional CSS class names merged onto the root element. |

## Examples

### Horizontal

```tsx
<ProgressIndicator
  steps={[{ label: 'Cart' }, { label: 'Shipping' }, { label: 'Payment' }]}
  currentIndex={1}
/>
```

### Vertical with descriptions

```tsx
<ProgressIndicator
  vertical
  steps={[{ label: 'Account', description: 'Your details' }, { label: 'Confirm' }]}
  currentIndex={0}
/>
```

## Design tokens

- `--cascivo-color-accent`
- `--cascivo-color-accent-subtle`
- `--cascivo-color-text`
- `--cascivo-color-text-muted`
- `--cascivo-color-text-subtle`
- `--cascivo-color-text-on-accent`
- `--cascivo-color-border`
- `--cascivo-color-surface`
- `--cascivo-radius-full`

## Accessibility

- **WCAG level:** 2.2-AA
- **ARIA role:** `list`

## Dependencies

- `@cascivo/core`

## Tags

steps, wizard, stepper, progress, navigation

---

_Generated from registry v0.11.0 on 2026-07-23. Docs track `main`; compare with https://cascivo.com/registry.json `.version`._
