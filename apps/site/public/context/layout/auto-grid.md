# AutoGrid

**Category:** layout  
**Description:** Media-query-free responsive grid — columns auto-fill based on available space.

## When to use

- Responsive card or tile grids that auto-fit columns to available width
- Avoiding media queries — tracks wrap based on a minimum track width

## When NOT to use

- A fixed, known column count — use Grid
- Single-direction stacking — use Stack

## Related components

- **Grid** (alternative): Use when an explicit column count is required

## Accessibility rationale

Pure layout primitive with no semantic role; does not affect the accessibility tree.

## Props

| Name  | Type                          | Required | Default | Description                                            |
| ----- | ----------------------------- | -------- | ------- | ------------------------------------------------------ |
| `min` | `string`                      | No       | "16rem" | Minimum track width before items wrap to fewer columns |
| `gap` | `1\|2\|3\|4\|5\|6\|8\|10\|12` | No       | 4       | Spacing token step                                     |

## Tokens

- `--cascivo-space-*`

## Examples

### Auto-filling grid

Items fill available space and wrap when narrower than 12rem

```jsx
<AutoGrid min="12rem" gap={4}>
  <div>Card 1</div>
  <div>Card 2</div>
  <div>Card 3</div>
</AutoGrid>
```

## AI context prompt

Copy this into an LLM context bar before editing this component:

```text
I am modifying the cascivo AutoGrid component (layout). Media-query-free responsive grid — columns auto-fill based on available space.

Architecture constraints — follow exactly:
- Signals only (useSignal/useComputed/useSignalEffect from @cascivo/core). Never useState/useEffect/useContext/useReducer.
- Style only through --cascivo-* custom properties. No Tailwind, no inline styles, no CSS-in-JS.
- Responsive via @container queries on the canonical scale (30rem/40rem/64rem/80rem). Do not use global viewport @media breakpoints.
- Visual states (hover/focus/active/disabled) via CSS pseudo-classes, not JS.
- CSS logical properties only (RTL-safe).

AutoGrid is strictly bound to these tokens — use only these, do not invent token names:
  --cascivo-space-*

Accessibility: role "generic", WCAG 2.1-AA. Keep it AA.

Do not invent props, tokens, or global viewport media queries.
```
