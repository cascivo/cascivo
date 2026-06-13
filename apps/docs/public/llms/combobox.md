# Combobox

Filterable single-select with an animated custom listbox, built on the dropdown open/close machine

## Install

```bash
npx cascade add combobox
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

| Prop           | Type               | Required            | Default | Description |
| -------------- | ------------------ | ------------------- | ------- | ----------- | ------ | --- |
| `options`      | `ComboboxOption[]` | yes                 | —       | —           |
| `value`        | `string`           | no                  | —       | —           |
| `defaultValue` | `string`           | no                  | —       | —           |
| `onChange`     | `(value: string    | undefined) => void` | no      | —           | —      |
| `clearable`    | `boolean`          | no                  | `false` | —           |
| `searchable`   | `boolean`          | no                  | `true`  | —           |
| `label`        | `string`           | no                  | —       | —           |
| `hint`         | `string`           | no                  | —       | —           |
| `error`        | `string`           | no                  | —       | —           |
| `size`         | `'sm'              | 'md'                | 'lg'`   | no          | `'md'` | —   |
| `disabled`     | `boolean`          | no                  | `false` | —           |
| `labels`       | `ComboboxLabels`   | no                  | —       | —           |
| `className`    | `string`           | no                  | —       | —           |

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
