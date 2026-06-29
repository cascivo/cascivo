# TimePicker

**Category:** inputs  
**Description:** Native time input wrapper with label, hint, error, and size variants

## When to use

- Capturing a time of day (HH:mm) in a form, such as a meeting or reminder time
- You want the native OS time entry UX with built-in formatting and validation
- A time field that needs a label, hint, error, or min/max bounds

## When NOT to use

- Picking a calendar date — use DatePicker
- A free-form or non-time text value — use Input

## Anti-patterns

### A plain Input cannot enforce time format or offer the native time UI; TimePicker gives parsing and locale handling for free

**Bad:** `<Input placeholder="HH:mm" /> // hand-rolled time field`  
**Good:** `<TimePicker label="Start" />`  
**Why:** A plain Input cannot enforce time format or offer the native time UI; TimePicker gives parsing and locale handling for free

## Related components

- **DatePicker** (alternative): Use when a calendar date is needed instead of a time
- **Input** (alternative): Use for non-time free-text values

## Accessibility rationale

Renders a native <input type="time"> so segmented HH/mm entry, format enforcement, and keyboard support come from the platform; error text is linked via aria-describedby with aria-invalid.

## Props

| Name           | Type                      | Required | Default | Description                                                        |
| -------------- | ------------------------- | -------- | ------- | ------------------------------------------------------------------ | ---- | ----------------------------------------------------- |
| `value`        | `string`                  | No       | —       | Controlled value (HH:mm)                                           |
| `defaultValue` | `string`                  | No       | —       | The initial value when uncontrolled.                               |
| `onChange`     | `(value: string) => void` | No       | —       | Called when the value changes.                                     |
| `min`          | `string`                  | No       | —       | Minimum allowed value.                                             |
| `max`          | `string`                  | No       | —       | Maximum allowed value.                                             |
| `step`         | `number`                  | No       | —       | Increment between allowed values.                                  |
| `label`        | `string`                  | No       | —       | Text label for the control.                                        |
| `hint`         | `string`                  | No       | —       | Supplementary hint text shown with the control.                    |
| `error`        | `string`                  | No       | —       | Error message shown when the value is invalid.                     |
| `size`         | `'sm'                     | 'md'     | 'lg'`   | No                                                                 | 'md' | Visual size of the component (e.g. 'sm', 'md', 'lg'). |
| `disabled`     | `boolean`                 | No       | —       | When true, disables the control and removes it from the tab order. |
| `className`    | `string`                  | No       | —       | Additional CSS class names merged onto the root element.           |

## Tokens

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

## Examples

### Basic time picker

```jsx
<TimePicker label="Meeting time" onChange={(v) => console.log(v)} />
```

## Boundaries

| Area         | Level    | Note                                                            |
| ------------ | -------- | --------------------------------------------------------------- |
| value format | strict   | Value is a 24-hour HH:mm string driven by the native time input |
| min/max/step | flexible | Consumer-defined bounds and step granularity                    |

## AI context prompt

Copy this into an LLM context bar before editing this component:

```text
I am modifying the cascivo TimePicker component (inputs). Native time input wrapper with label, hint, error, and size variants

Architecture constraints — follow exactly:
- Signals only (useSignal/useComputed/useSignalEffect from @cascivo/core). Never useState/useEffect/useContext/useReducer.
- Style only through --cascivo-* custom properties. No Tailwind, no inline styles, no CSS-in-JS.
- Responsive via @container queries on the canonical scale (30rem/40rem/64rem/80rem). Do not use global viewport @media breakpoints.
- Visual states (hover/focus/active/disabled) via CSS pseudo-classes, not JS.
- CSS logical properties only (RTL-safe).

TimePicker is strictly bound to these tokens — use only these, do not invent token names:
  --cascivo-color-surface, --cascivo-color-bg-subtle, --cascivo-color-border, --cascivo-color-border-strong, --cascivo-color-text, --cascivo-color-text-muted, --cascivo-color-accent, --cascivo-color-danger, --cascivo-radius-input, --cascivo-radius-md

Accessibility: role "textbox", WCAG 2.2-AA, keyboard: Tab. Keep it AA.

Do not change (strict): value format — Value is a 24-hour HH:mm string driven by the native time input
Flexible: min/max/step.

Do not invent props, tokens, or global viewport media queries.
```
