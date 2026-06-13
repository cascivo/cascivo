# Checkbox

Binary toggle for forms, with indeterminate support

## Install

```bash
npx cascade add checkbox
```

## Category

`inputs`

## States

- `unchecked`
- `checked`
- `indeterminate`

## Props

| Prop            | Type                                         | Required | Default | Description |
| --------------- | -------------------------------------------- | -------- | ------- | ----------- |
| `label`         | `string`                                     | no       | —       | —           |
| `checked`       | `boolean`                                    | no       | —       | —           |
| `indeterminate` | `boolean`                                    | no       | `false` | —           |
| `disabled`      | `boolean`                                    | no       | `false` | —           |
| `onChange`      | `React.ChangeEventHandler<HTMLInputElement>` | no       | —       | —           |

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

- `--cascade-color-surface`
- `--cascade-color-accent`
- `--cascade-color-border-strong`
- `--cascade-color-text-on-accent`
- `--cascade-radius-sm`
- `--cascade-focus-ring`

## Accessibility

- **WCAG level:** 2.2-AA
- **ARIA role:** `checkbox`
- **Keyboard:** Space

## Dependencies

- `@cascade-ui/core`

## Tags

form, toggle, boolean
