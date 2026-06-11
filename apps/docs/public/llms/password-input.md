# PasswordInput

Password input with reveal toggle and optional strength meter

## Install

```bash
npx cascade add password-input
```

## Category

`inputs`

## Sizes

- `sm`
- `md`
- `lg`

## States

- `idle`
- `revealed`

## Props

| Prop                | Type                                               | Required | Default | Description |
| ------------------- | -------------------------------------------------- | -------- | ------- | ----------- | ---- | --- |
| `showStrengthMeter` | `boolean`                                          | no       | `false` | —           |
| `size`              | `'sm'                                              | 'md'     | 'lg'`   | no          | `md` | —   |
| `labels`            | `PasswordInputLabels`                              | no       | —       | —           |
| `disabled`          | `boolean`                                          | no       | `false` | —           |
| `placeholder`       | `string`                                           | no       | —       | —           |
| `value`             | `string`                                           | no       | —       | —           |
| `onChange`          | `(e: React.ChangeEvent<HTMLInputElement>) => void` | no       | —       | —           |

## Examples

### Basic

```tsx
<PasswordInput placeholder="Enter password" />
```

### With strength meter

```tsx
<PasswordInput showStrengthMeter placeholder="Create password" />
```

## Design tokens

- `--cascade-color-surface`
- `--cascade-color-border`
- `--cascade-color-accent`
- `--cascade-color-destructive`
- `--cascade-color-warning`
- `--cascade-color-success`
- `--cascade-radius-input`
- `--cascade-focus-ring`

## Accessibility

- **WCAG level:** AA
- **ARIA role:** `textbox`
- **Keyboard:** Tab, Shift+Tab

## Dependencies

- `@cascade-ui/core`
- `@cascade-ui/i18n`

## Tags

form, password, input, security
