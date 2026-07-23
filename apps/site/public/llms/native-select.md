# NativeSelect

A styled native <select> that keeps platform form/keyboard behavior with a custom chevron and focus ring

## Install

Copy-paste the source (you own and can edit it):

```bash
npx cascivo add native-select
```

Or use it from the prebuilt package without copying:

```tsx
import { NativeSelect } from '@cascivo/react'
```

## Category

`inputs`

## Sizes

- `sm`
- `md`
- `lg`

## States

- `default`
- `focus`
- `disabled`
- `invalid`

## Props

| Prop           | Type                                          | Required | Default | Description                                                        |
| -------------- | --------------------------------------------- | -------- | ------- | ------------------------------------------------------------------ |
| `options`      | `NativeSelectOption[]`                        | no       | —       | Options to render. Alternatively pass <option> children.           |
| `children`     | `React.ReactNode`                             | no       | —       | Raw <option> children (used when options is not provided).         |
| `size`         | `'sm' \| 'md' \| 'lg'`                        | no       | `md`    | Visual size of the component (e.g. 'sm', 'md', 'lg').              |
| `invalid`      | `boolean`                                     | no       | —       | Marks the control as invalid for error styling and a11y.           |
| `placeholder`  | `string`                                      | no       | —       | Placeholder rendered as a disabled, hidden first option.           |
| `value`        | `string`                                      | no       | —       | The controlled value.                                              |
| `defaultValue` | `string`                                      | no       | —       | The initial value when uncontrolled.                               |
| `onChange`     | `React.ChangeEventHandler<HTMLSelectElement>` | no       | —       | Called when the selected value changes.                            |
| `disabled`     | `boolean`                                     | no       | —       | When true, disables the control and removes it from the tab order. |
| `className`    | `string`                                      | no       | —       | Additional CSS class names merged onto the root element.           |

## Examples

### Basic

```tsx
<NativeSelect
  placeholder="Choose a country"
  options={[
    { value: 'us', label: 'United States' },
    { value: 'de', label: 'Germany' },
  ]}
  onChange={(e) => setCountry(e.target.value)}
/>
```

### Option children

```tsx
<NativeSelect size="sm" defaultValue="light" aria-label="Theme">
  <option value="light">Light</option>
  <option value="dark">Dark</option>
</NativeSelect>
```

### Invalid

```tsx
<NativeSelect invalid placeholder="Required" options={countries} />
```

## Design tokens

- `--cascivo-color-surface`
- `--cascivo-color-border`
- `--cascivo-color-border-strong`
- `--cascivo-color-accent`
- `--cascivo-color-destructive`
- `--cascivo-color-text-muted`
- `--cascivo-radius-field`
- `--cascivo-focus-ring`

## Accessibility

- **WCAG level:** 2.2-AA
- **ARIA role:** `combobox`
- **Keyboard:** ArrowUp, ArrowDown, Enter, Space, Home, End

## Dependencies

- `@cascivo/core`

## Tags

inputs, select, native, form, dropdown

---

_Generated from registry v0.10.0 on 2026-07-23. Docs track `main`; compare with https://cascivo.com/registry.json `.version`._
