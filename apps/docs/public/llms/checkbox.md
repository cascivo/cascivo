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
