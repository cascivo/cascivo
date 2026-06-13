# Slider

Range input for selecting a value within bounds

## Install

```bash
npx cascade add slider
```

## Category

`inputs`

## Props

| Prop           | Type      | Required | Default | Description |
| -------------- | --------- | -------- | ------- | ----------- |
| `label`        | `string`  | no       | —       | —           |
| `min`          | `number`  | no       | `0`     | —           |
| `max`          | `number`  | no       | `100`   | —           |
| `step`         | `number`  | no       | `1`     | —           |
| `value`        | `number`  | no       | —       | —           |
| `defaultValue` | `number`  | no       | —       | —           |
| `disabled`     | `boolean` | no       | `false` | —           |

## Examples

### Basic

```tsx
<Slider label="Volume" defaultValue={50} />
```

### Stepped

```tsx
<Slider label="Rating" min={0} max={5} step={1} />
```

## Design tokens

- `--cascivo-color-accent`
- `--cascivo-color-border-strong`
- `--cascivo-color-surface`
- `--cascivo-radius-full`
- `--cascivo-focus-ring`

## Accessibility

- **WCAG level:** 2.2-AA
- **ARIA role:** `slider`
- **Keyboard:** ArrowLeft, ArrowRight, ArrowUp, ArrowDown, Home, End

## Dependencies

- `@cascivo/core`

## Tags

form, range, input
