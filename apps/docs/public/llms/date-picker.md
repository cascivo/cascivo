# DatePicker

An accessible date-picker with a calendar popover.

## Install

```bash
npx cascivo add date-picker
```

## Category

`inputs`

## Sizes

- `sm`
- `md`
- `lg`

## States

- `default`
- `open`
- `error`
- `disabled`

## Props

| Prop           | Type               | Required            | Default | Description                            |
| -------------- | ------------------ | ------------------- | ------- | -------------------------------------- | --------------------------------- | ---------- |
| `value`        | `string`           | no                  | —       | Controlled ISO date value (YYYY-MM-DD) |
| `defaultValue` | `string`           | no                  | —       | Uncontrolled default value             |
| `onChange`     | `(value: string    | undefined) => void` | no      | —                                      | Called on date selection or clear |
| `min`          | `string`           | no                  | —       | Minimum ISO date                       |
| `max`          | `string`           | no                  | —       | Maximum ISO date                       |
| `clearable`    | `boolean`          | no                  | —       | Shows a clear button                   |
| `label`        | `string`           | no                  | —       | Field label                            |
| `hint`         | `string`           | no                  | —       | Hint text                              |
| `error`        | `string`           | no                  | —       | Error message                          |
| `size`         | `'sm'              | 'md'                | 'lg'`   | no                                     | —                                 | Field size |
| `disabled`     | `boolean`          | no                  | —       | Disables the picker                    |
| `labels`       | `DatePickerLabels` | no                  | —       | i18n label overrides                   |

## Examples

### Basic

Uncontrolled date picker

```tsx
<DatePicker label="Date" />
```

### Clearable

With clear button

```tsx
<DatePicker label="Date" clearable />
```

### With constraints

Date range constraint

```tsx
<DatePicker min="2024-01-01" max="2024-12-31" />
```

## Design tokens

- `--cascivo-date-picker-bg`
- `--cascivo-date-picker-border`
- `--cascivo-date-picker-radius`
- `--cascivo-date-picker-day-selected-bg`
- `--cascivo-date-picker-day-today-color`

## Accessibility

- **WCAG level:** 2.2-AA
- **ARIA role:** `combobox`
- **Keyboard:** Enter, Space, Escape, ArrowUp, ArrowDown, ArrowLeft, ArrowRight

## Dependencies

- `@cascivo/core`
- `@cascivo/i18n`

## Tags

date, calendar, picker, input, form
