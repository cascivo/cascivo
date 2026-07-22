# SegmentedControl

Mutually exclusive toggle group

## Install

Copy-paste the source (you own and can edit it):

```bash
npx cascivo add segmented-control
```

Or use it from the prebuilt package without copying:

```tsx
import { SegmentedControl } from '@cascivo/react'
```

## Category

`inputs`

## Sizes

- `sm`
- `md`
- `lg`

## States

- `idle`
- `selected`
- `disabled`

## Props

| Prop            | Type                       | Required | Default | Description                                                        |
| --------------- | -------------------------- | -------- | ------- | ------------------------------------------------------------------ |
| `options`       | `SegmentedControlOption[]` | yes      | —       | The selectable options.                                            |
| `value`         | `string`                   | yes      | —       | The controlled value.                                              |
| `onValueChange` | `(v: string) => void`      | yes      | —       | Called with the new value when it changes.                         |
| `size`          | `'sm' \| 'md' \| 'lg'`     | no       | `md`    | Visual size of the component (e.g. 'sm', 'md', 'lg').              |
| `disabled`      | `boolean`                  | no       | `false` | When true, disables the control and removes it from the tab order. |

## Examples

### Basic

```tsx
<SegmentedControl
  options={[
    { label: 'Day', value: 'day' },
    { label: 'Week', value: 'week' },
    { label: 'Month', value: 'month' },
  ]}
  value="day"
  onValueChange={() => {}}
/>
```

## Design tokens

- `--cascivo-color-bg-subtle`
- `--cascivo-color-border`
- `--cascivo-color-surface`
- `--cascivo-color-text`
- `--cascivo-radius-md`
- `--cascivo-radius-sm`
- `--cascivo-shadow-sm`

## Accessibility

- **WCAG level:** 2.2-AA
- **ARIA role:** `group`
- **Keyboard:** ArrowLeft, ArrowRight

## Dependencies

- `@cascivo/core`

## Tags

form, toggle, group, segmented, input

---

_Generated from registry v0.10.0 on 2026-07-22. Docs track `main`; compare with https://cascivo.com/registry.json `.version`._
