# Spacer

**Category:** layout  
**Description:** Fixed-height spacing block using design token steps.

## When to use

- Inserting a fixed vertical gap between blocks using spacing token steps
- Adding deliberate breathing room where margins are awkward

## When NOT to use

- Spacing a series of siblings — use Stack with a gap instead
- Arbitrary one-off spacing — prefer token-based gap props

## Related components

- **Stack** (alternative): Use gap on Stack to space multiple siblings consistently

## Accessibility rationale

Empty presentational spacer with no semantic role; ignored by assistive tech.

## Props

| Name   | Type | Required | Default | Description |
| ------ | ---- | -------- | ------- | ----------- | --- | --- | --- | --- | --- | --- | --- | ------------------ |
| `size` | `1   | 2        | 3       | 4           | 5   | 6   | 8   | 10  | 12` | No  | —   | Spacing token step |

## Tokens

- `--cascivo-space-*`

## Examples

### Spacer

Adds vertical space between elements

```jsx
<Spacer size={8} />
```

## AI context prompt

Copy this into an LLM context bar before editing this component:

```text
I am modifying the cascivo Spacer component (layout). Fixed-height spacing block using design token steps.

Architecture constraints — follow exactly:
- Signals only (useSignal/useComputed/useSignalEffect from @cascivo/core). Never useState/useEffect/useContext/useReducer.
- Style only through --cascivo-* custom properties. No Tailwind, no inline styles, no CSS-in-JS.
- Responsive via @container queries on the canonical scale (30rem/40rem/64rem/80rem). Do not use global viewport @media breakpoints.
- Visual states (hover/focus/active/disabled) via CSS pseudo-classes, not JS.
- CSS logical properties only (RTL-safe).

Spacer is strictly bound to these tokens — use only these, do not invent token names:
  --cascivo-space-*

Accessibility: role "none", WCAG 2.1-AA. Keep it AA.

Do not invent props, tokens, or global viewport media queries.
```
