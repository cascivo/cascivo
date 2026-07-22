# NumberInput

Numeric input with stepper buttons, clamping, precision, and locale formatting

## Install

Copy-paste the source (you own and can edit it):

```bash
npx cascivo add number-input
```

Or use it from the prebuilt package without copying:

```tsx
import { NumberInput } from '@cascivo/react'
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
| `value` | `number \| null` | no | — | The controlled value. |
| `defaultValue` | `number` | no | — | The initial value when uncontrolled. |
| `onValueChange` | `(value: number \| null) => void` | no | — | Fired on commit (blur, Enter, stepping); null when empty or unparseable |
| `onChange` | `(value: number \| null) => void` | no | — | Deprecated: use onValueChange (same number \| null) |
| `min` | `number` | no | — | Minimum allowed value. |
| `max` | `number` | no | — | Maximum allowed value. |
| `step` | `number` | no | `1` | Increment between allowed values. |
| `precision` | `number` | no | — | Decimal places applied on commit |
| `formatOptions` | `Intl.NumberFormatOptions` | no | — | Display formatting applied on blur; raw editable string while focused |
| `label` | `string` | no | — | Text label for the control. |
| `hint` | `string` | no | — | Supplementary hint text shown with the control. |
| `error` | `string` | no | — | Error message shown when the value is invalid. |
| `size` | `'sm' \| 'md' \| 'lg'` | no | `md` | Visual size of the component (e.g. 'sm', 'md', 'lg'). |
| `disabled` | `boolean` | no | `false` | When true, disables the control and removes it from the tab order. |
| `incrementLabel` | `string` | no | `Increment` | Accessible label for the increment button. |
| `decrementLabel` | `string` | no | `Decrement` | Accessible label for the decrement button. |

## Examples

### Basic

```tsx
<NumberInput label="Quantity" defaultValue={1} min={0} max={99} />
```

### Currency

```tsx
<NumberInput label="Price" precision={2} formatOptions={{ style: "currency", currency: "USD" }} />
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

---

_Generated from registry v0.9.0 on 2026-07-22. Docs track `main`; compare with https://cascivo.com/registry.json `.version`._
