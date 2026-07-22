# MultiSelect

Searchable multi-value select with popover listbox

## Install

Copy-paste the source (you own and can edit it):

```bash
npx cascivo add multi-select
```

Or use it from the prebuilt package without copying:

```tsx
import { MultiSelect } from '@cascivo/react'
```

## Category

`inputs`

## States

- `closed`
- `open`

## Props

| Prop            | Type                    | Required | Default | Description                                                        |
| --------------- | ----------------------- | -------- | ------- | ------------------------------------------------------------------ |
| `options`       | `MultiSelectOption[]`   | yes      | —       | The selectable options.                                            |
| `value`         | `string[]`              | yes      | —       | The controlled value.                                              |
| `onValueChange` | `(v: string[]) => void` | yes      | —       | Called with the new value when it changes.                         |
| `placeholder`   | `string`                | no       | —       | Placeholder text shown when the field is empty.                    |
| `disabled`      | `boolean`               | no       | `false` | When true, disables the control and removes it from the tab order. |
| `labels`        | `MultiSelectLabels`     | no       | —       | Overrides for the component’s user-visible strings (i18n).         |

## Examples

### Basic

```tsx
<MultiSelect
  options={[
    { label: 'One', value: '1' },
    { label: 'Two', value: '2' },
  ]}
  value={[]}
  onValueChange={() => {}}
/>
```

## Design tokens

- `--cascivo-color-surface`
- `--cascivo-color-border`
- `--cascivo-color-accent`
- `--cascivo-radius-input`
- `--cascivo-radius-md`
- `--cascivo-shadow-md`
- `--cascivo-focus-ring`
- `--cascivo-motion-enter`

## Accessibility

- **WCAG level:** 2.2-AA
- **ARIA role:** `listbox`
- **Keyboard:** ArrowDown, ArrowUp, Space, Enter, Escape

## Dependencies

- `@cascivo/core`
- `@cascivo/i18n`

## Tags

form, select, multi, input, popover

---

_Generated from registry v0.10.0 on 2026-07-22. Docs track `main`; compare with https://cascivo.com/registry.json `.version`._
