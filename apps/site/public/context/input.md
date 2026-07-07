# Input

**Category:** inputs  
**Description:** Text input field with optional label, hint, and error state

## When to use

- Collecting a single line of free-form text from the user
- Pairing a labelled field with optional hint and validation error messaging
- As a field control inside a Form, wired via form.field()

## When NOT to use

- Multi-line text — use Textarea
- Choosing from a fixed list of options — use Select, Combobox, or MultiSelect
- Editing one read-only value in place — use Editable

## Anti-patterns

### Placeholder text disappears on input and is not a substitute for a persistent, programmatically associated label

**Bad:** `<Input placeholder="Email" /> with no label`  
**Good:** `<Input label="Email" placeholder="you@example.com" />`  
**Why:** Placeholder text disappears on input and is not a substitute for a persistent, programmatically associated label

## Related components

- **Form** (contained-by): Input is the primary field control wired into a Form store
- **InputGroup** (pairs-with): Wrap Input in InputGroup to add prefix/suffix addons
- **Textarea** (alternative): Use Textarea for multi-line input

## Accessibility rationale

The label is associated to the input via htmlFor/id, error text is linked through aria-describedby and announced with role="alert", and aria-invalid is set when an error is present so assistive tech reports the field as erroneous; visual focus state is driven by CSS, not tracked imperatively.

## Props

| Name          | Type                   | Required | Default | Description                                                        |
| ------------- | ---------------------- | -------- | ------- | ------------------------------------------------------------------ |
| `label`       | `string`               | No       | —       | Text label for the control.                                        |
| `hint`        | `string`               | No       | —       | Supplementary hint text shown with the control.                    |
| `error`       | `string`               | No       | —       | Error message shown when the value is invalid.                     |
| `size`        | `'sm' \| 'md' \| 'lg'` | No       | md      | Visual size of the component (e.g. 'sm', 'md', 'lg').              |
| `placeholder` | `string`               | No       | —       | Placeholder text shown when the field is empty.                    |
| `disabled`    | `boolean`              | No       | false   | When true, disables the control and removes it from the tab order. |

## Tokens

- `--cascivo-color-surface`
- `--cascivo-color-border`
- `--cascivo-color-accent`
- `--cascivo-color-destructive`
- `--cascivo-radius-input`
- `--cascivo-focus-ring`

## Examples

### With label

```jsx
<Input label="Email" placeholder="you@example.com" />
```

### With error

```jsx
<Input label="Email" error="Invalid email address" />
```

## Boundaries

| Area                      | Level    | Note                                                                                                        |
| ------------------------- | -------- | ----------------------------------------------------------------------------------------------------------- |
| token names               | strict   | Surface, border, accent, destructive, radius, and focus-ring must resolve to the listed --cascivo-\* tokens |
| label / hint / error copy | flexible | Free, within content tone guidance                                                                          |
| size                      | flexible | sm \| md \| lg, defaulting to md                                                                            |

## AI context prompt

Copy this into an LLM context bar before editing this component:

```text
I am modifying the cascivo Input component (inputs). Text input field with optional label, hint, and error state

Architecture constraints — follow exactly:
- Signals only (useSignal/useComputed/useSignalEffect from @cascivo/core). Never useState/useEffect/useContext/useReducer.
- Style only through --cascivo-* custom properties. No Tailwind, no inline styles, no CSS-in-JS.
- Responsive via @container queries on the canonical scale (30rem/40rem/64rem/80rem). Do not use global viewport @media breakpoints.
- Visual states (hover/focus/active/disabled) via CSS pseudo-classes, not JS.
- CSS logical properties only (RTL-safe).

Input is strictly bound to these tokens — use only these, do not invent token names:
  --cascivo-color-surface, --cascivo-color-border, --cascivo-color-accent, --cascivo-color-destructive, --cascivo-radius-input, --cascivo-focus-ring

Accessibility: role "textbox", WCAG 2.2-AA, keyboard: Tab/Shift+Tab. Keep it AA.

Do not change (strict): token names — Surface, border, accent, destructive, radius, and focus-ring must resolve to the listed --cascivo-* tokens
Flexible: label / hint / error copy, size.

Do not invent props, tokens, or global viewport media queries.
```
