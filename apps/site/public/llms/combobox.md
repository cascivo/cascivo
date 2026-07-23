# Combobox

Filterable single-select with an animated custom listbox, built on the dropdown open/close machine

## Install

Copy-paste the source (you own and can edit it):

```bash
npx cascivo add combobox
```

Or use it from the prebuilt package without copying:

```tsx
import { Combobox } from '@cascivo/react'
```

## Category

`inputs`

## Sizes

- `sm`
- `md`
- `lg`

## States

- `closed`
- `open`
- `error`

## Props

| Prop            | Type                                   | Required | Default | Description                                                                     |
| --------------- | -------------------------------------- | -------- | ------- | ------------------------------------------------------------------------------- |
| `id`            | `string`                               | no       | —       | Base id for the input and its listbox/aria wiring; auto-generated when omitted. |
| `options`       | `ComboboxOption[]`                     | yes      | —       | The selectable options.                                                         |
| `value`         | `string`                               | no       | —       | The controlled value.                                                           |
| `defaultValue`  | `string`                               | no       | —       | The initial value when uncontrolled.                                            |
| `onValueChange` | `(value: string \| undefined) => void` | no       | —       | Called with the selected option value (or undefined when cleared).              |
| `onChange`      | `(value: string \| undefined) => void` | no       | —       | Deprecated: use onValueChange (same string \| undefined).                       |
| `clearable`     | `boolean`                              | no       | `false` | When true, shows a control to clear the selected value.                         |
| `searchable`    | `boolean`                              | no       | `true`  | When true, shows a search/filter input.                                         |
| `label`         | `string`                               | no       | —       | Text label for the control.                                                     |
| `hint`          | `string`                               | no       | —       | Supplementary hint text shown with the control.                                 |
| `error`         | `string`                               | no       | —       | Error message shown when the value is invalid.                                  |
| `size`          | `'sm' \| 'md' \| 'lg'`                 | no       | `'md'`  | Visual size of the component (e.g. 'sm', 'md', 'lg').                           |
| `disabled`      | `boolean`                              | no       | `false` | When true, disables the control and removes it from the tab order.              |
| `labels`        | `ComboboxLabels`                       | no       | —       | Overrides for the component’s user-visible strings (i18n).                      |
| `className`     | `string`                               | no       | —       | Additional CSS class names merged onto the root element.                        |

## Examples

### Basic combobox

```tsx
<Combobox
  label="Country"
  options={[
    { value: 'us', label: 'United States' },
    { value: 'de', label: 'Germany' },
    { value: 'fr', label: 'France' },
  ]}
  onChange={(value) => console.log(value)}
/>
```

## Design tokens

- `--cascivo-color-surface`
- `--cascivo-color-surface-overlay`
- `--cascivo-color-bg-subtle`
- `--cascivo-color-border`
- `--cascivo-color-border-strong`
- `--cascivo-color-text`
- `--cascivo-color-text-muted`
- `--cascivo-color-text-subtle`
- `--cascivo-color-accent`
- `--cascivo-color-danger`
- `--cascivo-radius-input`
- `--cascivo-radius-md`
- `--cascivo-radius-sm`
- `--cascivo-shadow-lg`
- `--cascivo-motion-enter`
- `--cascivo-z-dropdown`

## Accessibility

- **WCAG level:** 2.2-AA
- **ARIA role:** `combobox`
- **Keyboard:** ArrowDown, ArrowUp, Enter, Escape, Tab

## Dependencies

- `@cascivo/core`
- `@cascivo/i18n`

## Tags

select, combobox, dropdown, filter, search

---

_Generated from registry v0.10.1 on 2026-07-23. Docs track `main`; compare with https://cascivo.com/registry.json `.version`._
