# NumberInput

**Category:** inputs  
**Description:** Numeric input with stepper buttons, clamping, precision, and locale formatting

## When to use

- Collecting a bounded numeric value where increment/decrement by a known step is natural (quantity, opacity, count)
- Numeric entry that needs clamping to min/max, fixed precision, or locale-aware display formatting (e.g. currency)
- Inputs where keyboard ArrowUp/ArrowDown stepping speeds up adjustment

## When NOT to use

- Free-form or non-numeric text — use Input
- Choosing along a continuous range where the exact number matters less than the relative position — use Slider
- Phone numbers, PINs, or codes that are digit strings rather than quantities — use Input or OtpInput

## Anti-patterns

### NumberInput adds stepper buttons, clamping, precision rounding, and Intl formatting that a raw number input does not, and reports a parsed number | null rather than a string

**Bad:** `<Input type="number" onChange={...} />`  
**Good:** `<NumberInput min={0} max={99} step={1} onChange={...} />`  
**Why:** NumberInput adds stepper buttons, clamping, precision rounding, and Intl formatting that a raw number input does not, and reports a parsed number | null rather than a string

## Related components

- **Input** (alternative): Use for unbounded or non-numeric text entry
- **Slider** (alternative): Use when approximate position on a range matters more than an exact typed number

## Accessibility rationale

Exposes role="spinbutton" with aria-valuenow/min/max so assistive tech announces the current value and bounds; stepper buttons are taken out of the tab order (tabIndex=-1) and labeled, keeping keyboard focus on the field while ArrowUp/ArrowDown drive stepping.

## Props

| Name | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `value` | `number | null` | No | — | — |
| `defaultValue` | `number` | No | — | — |
| `onChange` | `(value: number | null) => void` | No | — | Fired on commit (blur, Enter, stepping); null when empty or unparseable |
| `min` | `number` | No | — | — |
| `max` | `number` | No | — | — |
| `step` | `number` | No | 1 | — |
| `precision` | `number` | No | — | Decimal places applied on commit |
| `formatOptions` | `Intl.NumberFormatOptions` | No | — | Display formatting applied on blur; raw editable string while focused |
| `label` | `string` | No | — | — |
| `hint` | `string` | No | — | — |
| `error` | `string` | No | — | — |
| `size` | `'sm' | 'md' | 'lg'` | No | md | — |
| `disabled` | `boolean` | No | false | — |
| `incrementLabel` | `string` | No | Increment | — |
| `decrementLabel` | `string` | No | Decrement | — |

## Tokens

- `--cascade-color-surface`
- `--cascade-color-border`
- `--cascade-color-accent`
- `--cascade-color-destructive`
- `--cascade-color-bg-subtle`
- `--cascade-color-text-subtle`
- `--cascade-radius-input`
- `--cascade-focus-ring`

## Examples

### Basic

```jsx
<NumberInput label="Quantity" defaultValue={1} min={0} max={99} />
```

### Currency

```jsx
<NumberInput label="Price" precision={2} formatOptions={{ style: "currency", currency: "USD" }} />
```

### Stepped

```jsx
<NumberInput label="Opacity" min={0} max={1} step={0.1} />
```

## Boundaries

| Area | Level | Note |
|------|-------|------|
| token names | strict | Visual props must resolve to the listed --cascade-* semantic tokens |
| formatting and bounds | flexible | min, max, step, precision, and formatOptions are free to suit the value domain |
| stepper labels | flexible | incrementLabel/decrementLabel override the i18n defaults |
