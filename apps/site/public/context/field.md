# Field

**Category:** inputs  
**Description:** Form-field wrapper composing label, control, description, and error

## When to use

- Pairing a single control with its label, helper text, and validation message
- Wiring aria-describedby / aria-invalid automatically instead of by hand

## When NOT to use

- A standalone control that needs no label, description, or error
- Grouping multiple related controls — use a <fieldset> with a <legend>

## Anti-patterns

### Field owns the label; a labelled child (Input, Textarea, NativeSelect, …) renders a SECOND <label> for the same control. Omit the child's label inside a Field (dev builds warn).

**Bad:** `<Field label="Email"><Input label="Email" /></Field>`  
**Good:** `<Field label="Email"><Input /></Field>`  
**Why:** Field owns the label; a labelled child (Input, Textarea, NativeSelect, …) renders a SECOND <label> for the same control. Omit the child's label inside a Field (dev builds warn).

### Field clones exactly one child control to inject its id and aria wiring; multiple children break the association

**Bad:** `<Field label="Email"><Input /><Input /></Field>`  
**Good:** `<Field label="Email"><Input /></Field>`  
**Why:** Field clones exactly one child control to inject its id and aria wiring; multiple children break the association

### Hand-wired markup easily drifts: missing ids, no role="alert", mismatched aria-describedby — Field keeps them in sync

**Bad:** `<div><label>Email</label><input aria-invalid /><span>Error</span></div>`  
**Good:** `<Field label="Email" error="Error"><Input /></Field>`  
**Why:** Hand-wired markup easily drifts: missing ids, no role="alert", mismatched aria-describedby — Field keeps them in sync

## Related components

- **Label** (contains): Field renders a Label and links it to the control via htmlFor
- **Input** (contains): The control passed as children receives the generated id and aria attributes

## Accessibility rationale

Generates stable ids with useId and links them through htmlFor and aria-describedby; the error carries role="alert" so it is announced on appearance, and aria-invalid marks the control invalid for assistive tech

## Props

| Name | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `label` | `ReactNode` | No | — | Text label for the control. |
| `description` | `ReactNode` | No | — | Supporting description text. |
| `error` | `ReactNode` | No | — | Error message shown when the value is invalid. |
| `required` | `boolean` | No | false | When true, marks the field as required. |
| `disabled` | `boolean` | No | false | When true, disables the control and removes it from the tab order. |
| `id` | `string` | No | — | Id applied to the root element (auto-generated when omitted). |
| `children` | `ReactElement` | Yes | — | Content rendered inside the component. |

## Tokens

- `--cascivo-space-2`
- `--cascivo-font-sans`
- `--cascivo-text-sm`
- `--cascivo-leading-snug`
- `--cascivo-color-text-muted`
- `--cascivo-color-destructive`

## Examples

### Basic

```jsx
<Field label="Email"><Input type="email" /></Field>
```

### With description

```jsx
<Field label="Email" description="We never share it."><Input /></Field>
```

### With error

Sets aria-invalid on the control and announces the error via role="alert".

```jsx
<Field label="Email" error="Email is required" required><Input /></Field>
```

## Boundaries

| Area | Level | Note |
|------|-------|------|
| token names | strict | Spacing and color must resolve to --cascivo-* semantic tokens |
| control element | flexible | Any single element accepting id/aria-* props can be the child control |

## AI context prompt

Copy this into an LLM context bar before editing this component:

```text
I am modifying the cascivo Field component (inputs). Form-field wrapper composing label, control, description, and error

Architecture constraints — follow exactly:
- Signals only (useSignal/useComputed/useSignalEffect from @cascivo/core). Never useState/useEffect/useContext/useReducer.
- Style only through --cascivo-* custom properties. No Tailwind, no inline styles, no CSS-in-JS.
- Responsive via @container queries on the canonical scale (30rem/40rem/64rem/80rem). Do not use global viewport @media breakpoints.
- @container queries need an ancestor that establishes containment (container-type: inline-size). An element can never be its own query container, so a component whose own rule restyles itself via @container must render an outer wrapper that establishes the container (see Grid/Columns). Section and other layout wrappers already establish one for their descendants.
- Visual states (hover/focus/active/disabled) via CSS pseudo-classes, not JS.
- CSS logical properties only (RTL-safe).

Field is strictly bound to these tokens — use only these, do not invent token names:
  --cascivo-space-2, --cascivo-font-sans, --cascivo-text-sm, --cascivo-leading-snug, --cascivo-color-text-muted, --cascivo-color-destructive

Accessibility: role "group", WCAG 2.2-AA. Keep it AA.

Do not change (strict): token names — Spacing and color must resolve to --cascivo-* semantic tokens
Flexible: control element.

Do not invent props, tokens, or global viewport media queries.
```
