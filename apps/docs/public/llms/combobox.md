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

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `options` | `ComboboxOption[]` | yes | — | — |
| `value` | `string` | no | — | — |
| `defaultValue` | `string` | no | — | — |
| `onChange` | `(value: string | undefined) => void` | no | — | — |
| `clearable` | `boolean` | no | `false` | — |
| `searchable` | `boolean` | no | `true` | — |
| `label` | `string` | no | — | — |
| `hint` | `string` | no | — | — |
| `error` | `string` | no | — | — |
| `size` | `'sm' | 'md' | 'lg'` | no | `'md'` | — |
| `disabled` | `boolean` | no | `false` | — |
| `labels` | `ComboboxLabels` | no | — | — |
| `className` | `string` | no | — | — |

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

- `--cascade-color-surface`
- `--cascade-color-surface-overlay`
- `--cascade-color-bg-subtle`
- `--cascade-color-border`
- `--cascade-color-border-strong`
- `--cascade-color-text`
- `--cascade-color-text-muted`
- `--cascade-color-text-subtle`
- `--cascade-color-accent`
- `--cascade-color-danger`
- `--cascade-radius-input`
- `--cascade-radius-md`
- `--cascade-radius-sm`
- `--cascade-shadow-lg`
- `--cascade-motion-enter`
- `--cascade-z-dropdown`

## Accessibility

- **WCAG level:** AA
- **ARIA role:** `combobox`
- **Keyboard:** ArrowDown, ArrowUp, Enter, Escape, Tab

## Dependencies

- `@cascade-ui/core`
- `@cascade-ui/i18n`

## Tags

select, combobox, dropdown, filter, search
