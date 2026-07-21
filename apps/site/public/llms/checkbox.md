# Checkbox

Binary toggle for forms, with indeterminate support

## Install

Copy-paste the source (you own and can edit it):

```bash
npx cascivo add checkbox
```

Or use it from the prebuilt package without copying:

```tsx
import { Checkbox } from '@cascivo/react'
```

## Category

`inputs`

## States

- `unchecked`
- `checked`
- `indeterminate`

## Props

| Prop            | Type                                         | Required | Default | Description                                                        |
| --------------- | -------------------------------------------- | -------- | ------- | ------------------------------------------------------------------ |
| `label`         | `string`                                     | no       | —       | Text label for the control.                                        |
| `checked`       | `boolean`                                    | no       | —       | Whether the control is checked (controlled).                       |
| `indeterminate` | `boolean`                                    | no       | `false` | When true, renders the mixed/indeterminate state.                  |
| `disabled`      | `boolean`                                    | no       | `false` | When true, disables the control and removes it from the tab order. |
| `onChange`      | `React.ChangeEventHandler<HTMLInputElement>` | no       | —       | Called when the value changes.                                     |

## Examples

### With label

```tsx
<Checkbox label="Accept terms" />
```

### Indeterminate

```tsx
<Checkbox label="Select all" indeterminate />
```

## Design tokens

- `--cascivo-color-surface`
- `--cascivo-color-accent`
- `--cascivo-color-border-strong`
- `--cascivo-color-text-on-accent`
- `--cascivo-radius-sm`
- `--cascivo-focus-ring`

## Accessibility

- **WCAG level:** 2.2-AA
- **ARIA role:** `checkbox`
- **Keyboard:** Space

## Dependencies

- `@cascivo/core`

## Tags

form, toggle, boolean

---

_Generated from registry v0.9.0 on 2026-07-21. Docs track `main`; compare with https://cascivo.com/registry.json `.version`._
