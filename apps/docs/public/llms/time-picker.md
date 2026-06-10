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

- `--cascade-color-surface`
- `--cascade-color-bg-subtle`
- `--cascade-color-border`
- `--cascade-color-border-strong`
- `--cascade-color-text`
- `--cascade-color-text-muted`
- `--cascade-color-accent`
- `--cascade-color-danger`
- `--cascade-radius-input`
- `--cascade-radius-md`

## Accessibility

- **WCAG level:** AA
- **ARIA role:** `textbox`
- **Keyboard:** Tab

## Dependencies

- `@cascade-ui/core`

## Tags

time, input, form
