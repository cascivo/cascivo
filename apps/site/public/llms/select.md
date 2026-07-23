# Select

Native select menu styled to match the design system

## Install

Copy-paste the source (you own and can edit it):

```bash
npx cascivo add select
```

Or use it from the prebuilt package without copying:

```tsx
import { Select } from '@cascivo/react'
```

## Category

`inputs`

## Sizes

- `sm`
- `md`
- `lg`

## States

- `idle`
- `focused`
- `error`

## Props

| Prop          | Type                                                     | Required | Default | Description                                                        |
| ------------- | -------------------------------------------------------- | -------- | ------- | ------------------------------------------------------------------ |
| `label`       | `string`                                                 | no       | —       | Text label for the control.                                        |
| `hint`        | `string`                                                 | no       | —       | Supplementary hint text shown with the control.                    |
| `error`       | `string`                                                 | no       | —       | Error message shown when the value is invalid.                     |
| `placeholder` | `string`                                                 | no       | —       | Placeholder text shown when the field is empty.                    |
| `options`     | `{ value: string; label: string; disabled?: boolean }[]` | yes      | —       | The selectable options.                                            |
| `size`        | `'sm' \| 'md' \| 'lg'`                                   | no       | `md`    | Visual size of the component (e.g. 'sm', 'md', 'lg').              |
| `disabled`    | `boolean`                                                | no       | `false` | When true, disables the control and removes it from the tab order. |

## Examples

### Basic

```tsx
<Select label="Role" options={[{ value: 'admin', label: 'Admin' }]} />
```

### With placeholder

```tsx
<Select label="Country" placeholder="Choose…" options={countries} />
```

## Design tokens

- `--cascivo-color-surface`
- `--cascivo-color-border`
- `--cascivo-color-accent`
- `--cascivo-color-text-muted`
- `--cascivo-radius-input`
- `--cascivo-focus-ring`

## Accessibility

- **WCAG level:** 2.2-AA
- **ARIA role:** `listbox`
- **Keyboard:** ArrowUp, ArrowDown, Space

## Dependencies

- `@cascivo/core`

## Tags

form, dropdown, menu

---

_Generated from registry v0.10.1 on 2026-07-23. Docs track `main`; compare with https://cascivo.com/registry.json `.version`._
