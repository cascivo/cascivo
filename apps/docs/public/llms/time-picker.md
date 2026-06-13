# TimePicker

Native time input wrapper with label, hint, error, and size variants

## Install

```bash
npx cascade add time-picker
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

| Prop           | Type                      | Required | Default | Description              |
| -------------- | ------------------------- | -------- | ------- | ------------------------ | ------ | --- |
| `value`        | `string`                  | no       | —       | Controlled value (HH:mm) |
| `defaultValue` | `string`                  | no       | —       | —                        |
| `onChange`     | `(value: string) => void` | no       | —       | —                        |
| `min`          | `string`                  | no       | —       | —                        |
| `max`          | `string`                  | no       | —       | —                        |
| `step`         | `number`                  | no       | —       | —                        |
| `label`        | `string`                  | no       | —       | —                        |
| `hint`         | `string`                  | no       | —       | —                        |
| `error`        | `string`                  | no       | —       | —                        |
| `size`         | `'sm'                     | 'md'     | 'lg'`   | no                       | `'md'` | —   |
| `disabled`     | `boolean`                 | no       | —       | —                        |
| `className`    | `string`                  | no       | —       | —                        |

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
