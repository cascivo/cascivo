# NumberInput

Numeric input with stepper buttons, clamping, precision, and locale formatting

## Install

```bash
npx cascade add number-input
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

| Prop             | Type                       | Required       | Default     | Description                                                           |
| ---------------- | -------------------------- | -------------- | ----------- | --------------------------------------------------------------------- | ----------------------------------------------------------------------- | --- |
| `value`          | `number                    | null`          | no          | —                                                                     | —                                                                       |
| `defaultValue`   | `number`                   | no             | —           | —                                                                     |
| `onChange`       | `(value: number            | null) => void` | no          | —                                                                     | Fired on commit (blur, Enter, stepping); null when empty or unparseable |
| `min`            | `number`                   | no             | —           | —                                                                     |
| `max`            | `number`                   | no             | —           | —                                                                     |
| `step`           | `number`                   | no             | `1`         | —                                                                     |
| `precision`      | `number`                   | no             | —           | Decimal places applied on commit                                      |
| `formatOptions`  | `Intl.NumberFormatOptions` | no             | —           | Display formatting applied on blur; raw editable string while focused |
| `label`          | `string`                   | no             | —           | —                                                                     |
| `hint`           | `string`                   | no             | —           | —                                                                     |
| `error`          | `string`                   | no             | —           | —                                                                     |
| `size`           | `'sm'                      | 'md'           | 'lg'`       | no                                                                    | `md`                                                                    | —   |
| `disabled`       | `boolean`                  | no             | `false`     | —                                                                     |
| `incrementLabel` | `string`                   | no             | `Increment` | —                                                                     |
| `decrementLabel` | `string`                   | no             | `Decrement` | —                                                                     |

## Examples

### Basic

```tsx
<NumberInput label="Quantity" defaultValue={1} min={0} max={99} />
```

### Currency

```tsx
<NumberInput label="Price" precision={2} formatOptions={{ style: 'currency', currency: 'USD' }} />
```

### Stepped

```tsx
<NumberInput label="Opacity" min={0} max={1} step={0.1} />
```

## Design tokens

- `--cascivo-color-surface`
- `--cascivo-color-border`
- `--cascivo-color-accent`
- `--cascivo-color-destructive`
- `--cascivo-color-bg-subtle`
- `--cascivo-color-text-subtle`
- `--cascivo-radius-input`
- `--cascivo-focus-ring`

## Accessibility

- **WCAG level:** 2.2-AA
- **ARIA role:** `spinbutton`
- **Keyboard:** ArrowUp, ArrowDown, Enter, Tab

## Dependencies

- `@cascivo/core`
- `@cascivo/i18n`

## Tags

form, number, input, spinbutton, stepper
