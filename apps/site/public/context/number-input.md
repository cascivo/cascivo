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
| `value` | `number \| null` | No | — | The controlled value. |
| `defaultValue` | `number` | No | — | The initial value when uncontrolled. |
| `onChange` | `(value: number \| null) => void` | No | — | Fired on commit (blur, Enter, stepping); null when empty or unparseable |
| `min` | `number` | No | — | Minimum allowed value. |
| `max` | `number` | No | — | Maximum allowed value. |
| `step` | `number` | No | 1 | Increment between allowed values. |
| `precision` | `number` | No | — | Decimal places applied on commit |
| `formatOptions` | `Intl.NumberFormatOptions` | No | — | Display formatting applied on blur; raw editable string while focused |
| `label` | `string` | No | — | Text label for the control. |
| `hint` | `string` | No | — | Supplementary hint text shown with the control. |
| `error` | `string` | No | — | Error message shown when the value is invalid. |
| `size` | `'sm' \| 'md' \| 'lg'` | No | md | Visual size of the component (e.g. 'sm', 'md', 'lg'). |
| `disabled` | `boolean` | No | false | When true, disables the control and removes it from the tab order. |
| `incrementLabel` | `string` | No | Increment | Accessible label for the increment button. |
| `decrementLabel` | `string` | No | Decrement | Accessible label for the decrement button. |

## Tokens

- `--cascivo-color-surface`
- `--cascivo-color-border`
- `--cascivo-color-accent`
- `--cascivo-color-destructive`
- `--cascivo-color-bg-subtle`
- `--cascivo-color-text-subtle`
- `--cascivo-radius-input`
- `--cascivo-focus-ring`

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
| token names | strict | Visual props must resolve to the listed --cascivo-* semantic tokens |
| formatting and bounds | flexible | min, max, step, precision, and formatOptions are free to suit the value domain |
| stepper labels | flexible | incrementLabel/decrementLabel override the i18n defaults |

## AI context prompt

Copy this into an LLM context bar before editing this component:

```text
I am modifying the cascivo NumberInput component (inputs). Numeric input with stepper buttons, clamping, precision, and locale formatting

Architecture constraints — follow exactly:
- Signals only (useSignal/useComputed/useSignalEffect from @cascivo/core). Never useState/useEffect/useContext/useReducer.
- Style only through --cascivo-* custom properties. No Tailwind, no inline styles, no CSS-in-JS.
- Responsive via @container queries on the canonical scale (30rem/40rem/64rem/80rem). Do not use global viewport @media breakpoints.
- Visual states (hover/focus/active/disabled) via CSS pseudo-classes, not JS.
- CSS logical properties only (RTL-safe).

NumberInput is strictly bound to these tokens — use only these, do not invent token names:
  --cascivo-color-surface, --cascivo-color-border, --cascivo-color-accent, --cascivo-color-destructive, --cascivo-color-bg-subtle, --cascivo-color-text-subtle, --cascivo-radius-input, --cascivo-focus-ring

Accessibility: role "spinbutton", WCAG 2.2-AA, keyboard: ArrowUp/ArrowDown/Enter/Tab. Keep it AA.

Do not change (strict): token names — Visual props must resolve to the listed --cascivo-* semantic tokens
Flexible: formatting and bounds, stepper labels.

Do not invent props, tokens, or global viewport media queries.
```
