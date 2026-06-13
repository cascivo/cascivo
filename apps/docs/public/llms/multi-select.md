# MultiSelect

Searchable multi-value select with popover listbox

## Install

```bash
npx cascade add multi-select
```

## Category

`inputs`

## States

- `closed`
- `open`

## Props

| Prop            | Type                    | Required | Default | Description |
| --------------- | ----------------------- | -------- | ------- | ----------- |
| `options`       | `MultiSelectOption[]`   | yes      | —       | —           |
| `value`         | `string[]`              | yes      | —       | —           |
| `onValueChange` | `(v: string[]) => void` | yes      | —       | —           |
| `placeholder`   | `string`                | no       | —       | —           |
| `disabled`      | `boolean`               | no       | `false` | —           |
| `labels`        | `MultiSelectLabels`     | no       | —       | —           |

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

- `@cascade-ui/core`
- `@cascade-ui/i18n`

## Tags

form, select, multi, input, popover
