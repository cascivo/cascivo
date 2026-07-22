# PasswordInput

Password input with reveal toggle and optional strength meter

## Install

Copy-paste the source (you own and can edit it):

```bash
npx cascivo add password-input
```

Or use it from the prebuilt package without copying:

```tsx
import { PasswordInput } from '@cascivo/react'
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

| Prop                | Type                                               | Required | Default | Description                                                        |
| ------------------- | -------------------------------------------------- | -------- | ------- | ------------------------------------------------------------------ |
| `showStrengthMeter` | `boolean`                                          | no       | `false` | When true, shows a password-strength meter.                        |
| `size`              | `'sm' \| 'md' \| 'lg'`                             | no       | `md`    | Visual size of the component (e.g. 'sm', 'md', 'lg').              |
| `labels`            | `PasswordInputLabels`                              | no       | —       | Overrides for the component’s user-visible strings (i18n).         |
| `disabled`          | `boolean`                                          | no       | `false` | When true, disables the control and removes it from the tab order. |
| `placeholder`       | `string`                                           | no       | —       | Placeholder text shown when the field is empty.                    |
| `value`             | `string`                                           | no       | —       | The controlled value.                                              |
| `onChange`          | `(e: React.ChangeEvent<HTMLInputElement>) => void` | no       | —       | Called when the value changes.                                     |

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

- `--cascivo-color-surface`
- `--cascivo-color-border`
- `--cascivo-color-accent`
- `--cascivo-color-destructive`
- `--cascivo-color-warning`
- `--cascivo-color-success`
- `--cascivo-radius-input`
- `--cascivo-focus-ring`

## Accessibility

- **WCAG level:** 2.2-AA
- **ARIA role:** `textbox`
- **Keyboard:** Tab, Shift+Tab

## Dependencies

- `@cascivo/core`
- `@cascivo/i18n`

## Tags

form, password, input, security

---

_Generated from registry v0.10.0 on 2026-07-22. Docs track `main`; compare with https://cascivo.com/registry.json `.version`._
