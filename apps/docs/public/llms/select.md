# Select

Native select menu styled to match the design system

## Install

```bash
npx cascade add select
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

| Prop          | Type                                                     | Required | Default | Description |
| ------------- | -------------------------------------------------------- | -------- | ------- | ----------- | ---- | --- |
| `label`       | `string`                                                 | no       | —       | —           |
| `hint`        | `string`                                                 | no       | —       | —           |
| `error`       | `string`                                                 | no       | —       | —           |
| `placeholder` | `string`                                                 | no       | —       | —           |
| `options`     | `{ value: string; label: string; disabled?: boolean }[]` | yes      | —       | —           |
| `size`        | `'sm'                                                    | 'md'     | 'lg'`   | no          | `md` | —   |
| `disabled`    | `boolean`                                                | no       | `false` | —           |

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

- `@cascade-ui/core`

## Tags

form, dropdown, menu
