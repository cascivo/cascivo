# Checkbox

**Category:** inputs  
**Description:** Binary toggle for forms, with indeterminate support

## When to use

- Selecting zero or more options from a list where each choice is independent
- A single opt-in within a form (accept terms, subscribe) submitted alongside other fields
- A "select all" control that needs an indeterminate (partial) state

## When NOT to use

- A binary setting that applies immediately on change — use Toggle
- Choosing exactly one option from a mutually exclusive set — use Radio

## Anti-patterns

### Checkbox signals a form value to be submitted; Toggle signals an immediate on/off state change

**Bad:** `<Checkbox label="Dark mode" /> that flips a setting live`  
**Good:** `<Toggle label="Dark mode" />`  
**Why:** Checkbox signals a form value to be submitted; Toggle signals an immediate on/off state change

### Independent checkboxes let the user select both or neither, which a single exclusive choice should not allow

**Bad:** `Two checkboxes for one either/or choice`  
**Good:** `Use Radio for mutually exclusive options`  
**Why:** Independent checkboxes let the user select both or neither, which a single exclusive choice should not allow

## Related components

- **Toggle** (alternative): Use for immediate binary settings rather than form values
- **Radio** (alternative): Use for selecting exactly one from a mutually exclusive set
- **CheckboxCard** (alternative): Use the card variant when each option needs a title plus description

## Accessibility rationale

Renders a native <input type="checkbox"> wrapped in a <label>, so role, checked/indeterminate state, Space activation, and label association come from the platform; the indeterminate visual is set on the DOM node since it is a property not an attribute

## Props

| Name            | Type                                         | Required | Default | Description                                                        |
| --------------- | -------------------------------------------- | -------- | ------- | ------------------------------------------------------------------ |
| `label`         | `string`                                     | No       | —       | Text label for the control.                                        |
| `checked`       | `boolean`                                    | No       | —       | Whether the control is checked (controlled).                       |
| `indeterminate` | `boolean`                                    | No       | false   | When true, renders the mixed/indeterminate state.                  |
| `disabled`      | `boolean`                                    | No       | false   | When true, disables the control and removes it from the tab order. |
| `onChange`      | `React.ChangeEventHandler<HTMLInputElement>` | No       | —       | Called when the value changes.                                     |

## Tokens

- `--cascivo-color-surface`
- `--cascivo-color-accent`
- `--cascivo-color-border-strong`
- `--cascivo-color-text-on-accent`
- `--cascivo-radius-sm`
- `--cascivo-focus-ring`

## Examples

### With label

```jsx
<Checkbox label="Accept terms" />
```

### Indeterminate

```jsx
<Checkbox label="Select all" indeterminate />
```

## Boundaries

| Area               | Level    | Note                                                                                    |
| ------------------ | -------- | --------------------------------------------------------------------------------------- |
| native input props | flexible | Spreads InputHTMLAttributes — name, value, required, checked, onChange all pass through |
| token names        | strict   | Control styling resolves to semantic --cascivo-color-\* / --cascivo-radius-sm tokens    |

## AI context prompt

Copy this into an LLM context bar before editing this component:

```text
I am modifying the cascivo Checkbox component (inputs). Binary toggle for forms, with indeterminate support

Architecture constraints — follow exactly:
- Signals only (useSignal/useComputed/useSignalEffect from @cascivo/core). Never useState/useEffect/useContext/useReducer.
- Style only through --cascivo-* custom properties. No Tailwind, no inline styles, no CSS-in-JS.
- Responsive via @container queries on the canonical scale (30rem/40rem/64rem/80rem). Do not use global viewport @media breakpoints.
- @container queries need an ancestor that establishes containment (container-type: inline-size). An element can never be its own query container, so a component whose own rule restyles itself via @container must render an outer wrapper that establishes the container (see Grid/Columns). Section and other layout wrappers already establish one for their descendants.
- Visual states (hover/focus/active/disabled) via CSS pseudo-classes, not JS.
- CSS logical properties only (RTL-safe).

Checkbox is strictly bound to these tokens — use only these, do not invent token names:
  --cascivo-color-surface, --cascivo-color-accent, --cascivo-color-border-strong, --cascivo-color-text-on-accent, --cascivo-radius-sm, --cascivo-focus-ring

Accessibility: role "checkbox", WCAG 2.2-AA, keyboard: Space. Keep it AA.

Do not change (strict): token names — Control styling resolves to semantic --cascivo-color-* / --cascivo-radius-sm tokens
Flexible: native input props.

Do not invent props, tokens, or global viewport media queries.
```
