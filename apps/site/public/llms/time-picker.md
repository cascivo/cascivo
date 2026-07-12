# TimePicker

Native time input wrapper with label, hint, error, and size variants

## Install

Copy-paste the source (you own and can edit it):

```bash
npx cascivo add time-picker
```

Or use it from the prebuilt package without copying:

```tsx
import { TimePicker } from '@cascivo/react'
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

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `value` | `string` | no | — | Controlled value (HH:mm) |
| `defaultValue` | `string` | no | — | The initial value when uncontrolled. |
| `onChange` | `(value: string) => void` | no | — | Called when the value changes. |
| `min` | `string` | no | — | Minimum allowed value. |
| `max` | `string` | no | — | Maximum allowed value. |
| `step` | `number` | no | — | Increment between allowed values. |
| `label` | `string` | no | — | Text label for the control. |
| `hint` | `string` | no | — | Supplementary hint text shown with the control. |
| `error` | `string` | no | — | Error message shown when the value is invalid. |
| `size` | `'sm' \| 'md' \| 'lg'` | no | `'md'` | Visual size of the component (e.g. 'sm', 'md', 'lg'). |
| `disabled` | `boolean` | no | — | When true, disables the control and removes it from the tab order. |
| `className` | `string` | no | — | Additional CSS class names merged onto the root element. |

## Examples

### Basic time picker

```tsx
<TimePicker label="Meeting time" onChange={(v) => console.log(v)} />
```

## Design tokens

- `--cascivo-color-surface`
- `--cascivo-color-bg-subtle`
- `--cascivo-color-border`
- `--cascivo-color-border-strong`
- `--cascivo-color-text`
- `--cascivo-color-text-muted`
- `--cascivo-color-accent`
- `--cascivo-color-danger`
- `--cascivo-radius-input`
- `--cascivo-radius-md`

## Accessibility

- **WCAG level:** 2.2-AA
- **ARIA role:** `textbox`
- **Keyboard:** Tab

## Dependencies

- `@cascivo/core`

## Tags

time, input, form
