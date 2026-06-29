# Input

Text input field with optional label, hint, and error state

## Install

Copy-paste the source (you own and can edit it):

```bash
npx cascivo add input
```

Or use it from the prebuilt package without copying:

```tsx
import { Input } from '@cascivo/react'
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

| Prop          | Type      | Required | Default | Description                                                        |
| ------------- | --------- | -------- | ------- | ------------------------------------------------------------------ | ---- | ----------------------------------------------------- |
| `label`       | `string`  | no       | —       | Text label for the control.                                        |
| `hint`        | `string`  | no       | —       | Supplementary hint text shown with the control.                    |
| `error`       | `string`  | no       | —       | Error message shown when the value is invalid.                     |
| `size`        | `'sm'     | 'md'     | 'lg'`   | no                                                                 | `md` | Visual size of the component (e.g. 'sm', 'md', 'lg'). |
| `placeholder` | `string`  | no       | —       | Placeholder text shown when the field is empty.                    |
| `disabled`    | `boolean` | no       | `false` | When true, disables the control and removes it from the tab order. |

## Examples

### With label

```tsx
<Input label="Email" placeholder="you@example.com" />
```

### With error

```tsx
<Input label="Email" error="Invalid email address" />
```

## Design tokens

- `--cascivo-color-surface`
- `--cascivo-color-border`
- `--cascivo-color-accent`
- `--cascivo-color-destructive`
- `--cascivo-radius-input`
- `--cascivo-focus-ring`

## Accessibility

- **WCAG level:** 2.2-AA
- **ARIA role:** `textbox`
- **Keyboard:** Tab, Shift+Tab

## Dependencies

- `@cascivo/core`

## Tags

form, text, input
