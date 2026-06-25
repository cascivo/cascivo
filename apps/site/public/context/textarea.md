# Textarea

**Category:** inputs  
**Description:** Multi-line text input with optional label, hint, and error state

## When to use

- Capturing multi-line free text such as messages, descriptions, or comments
- Input where line breaks are meaningful and the content may wrap to several rows
- Form fields that benefit from a visible hint or validation error beneath the control

## When NOT to use

- A single short value like a name or email — use Input
- A constrained numeric value — use NumberInput

## Anti-patterns

### A one-line value belongs in Input; a textarea invites unwanted line breaks and submits via Enter differently

**Bad:** `<Textarea label="Email" rows={1} />`  
**Good:** `<Input type="email" label="Email" />`  
**Why:** A one-line value belongs in Input; a textarea invites unwanted line breaks and submits via Enter differently

## Related components

- **Input** (alternative): Use for single-line values
- **Form** (contained-by): Typically grouped with other fields inside a form

## Accessibility rationale

Renders a native <textarea> with aria-multiline; hint and error text are associated via aria-describedby and errors use role="alert" with aria-invalid so assistive tech announces validation state.

## Props

| Name       | Type      | Required   | Default | Description |
| ---------- | --------- | ---------- | ------- | ----------- | -------- | --- |
| `label`    | `string`  | No         | —       | —           |
| `hint`     | `string`  | No         | —       | —           |
| `error`    | `string`  | No         | —       | —           |
| `rows`     | `number`  | No         | 4       | —           |
| `resize`   | `'none'   | 'vertical' | 'both'` | No          | vertical | —   |
| `disabled` | `boolean` | No         | false   | —           |

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
<Textarea label="Message" placeholder="Type here…" />
```

### With error

```jsx
<Textarea label="Bio" error="Bio is required" />
```

## Boundaries

| Area            | Level    | Note                                                                             |
| --------------- | -------- | -------------------------------------------------------------------------------- |
| token names     | strict   | Border/focus/error colors must resolve to --cascivo-color-\* / focus-ring tokens |
| resize and rows | flexible | Consumer chooses initial rows and whether the field can resize                   |

## AI context prompt

Copy this into an LLM context bar before editing this component:

```text
I am modifying the cascivo Textarea component (inputs). Multi-line text input with optional label, hint, and error state

Architecture constraints — follow exactly:
- Signals only (useSignal/useComputed/useSignalEffect from @cascivo/core). Never useState/useEffect/useContext/useReducer.
- Style only through --cascivo-* custom properties. No Tailwind, no inline styles, no CSS-in-JS.
- Responsive via @container queries on the canonical scale (30rem/40rem/64rem/80rem). Do not use global viewport @media breakpoints.
- Visual states (hover/focus/active/disabled) via CSS pseudo-classes, not JS.
- CSS logical properties only (RTL-safe).

Textarea is strictly bound to these tokens — use only these, do not invent token names:
  --cascivo-color-surface, --cascivo-color-border, --cascivo-color-accent, --cascivo-color-destructive, --cascivo-radius-input, --cascivo-focus-ring

Accessibility: role "textbox", WCAG 2.2-AA, keyboard: Tab/Shift+Tab. Keep it AA.

Do not change (strict): token names — Border/focus/error colors must resolve to --cascivo-color-* / focus-ring tokens
Flexible: resize and rows.

Do not invent props, tokens, or global viewport media queries.
```
