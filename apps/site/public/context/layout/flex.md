# Flex

**Category:** layout  
**Description:** Flex layout primitive for vertical or horizontal stacking with gap control.

## When to use

- Arranging children vertically or horizontally with a consistent gap
- The default primitive for spacing a small set of elements in one direction

## When NOT to use

- Two-dimensional layouts — use Grid
- Responsive auto-wrapping card collections — use AutoGrid
- A visual card-pile / overlapping avatars — that is `Stack` in @cascivo/react (an `offset` prop), a different component.

## Anti-patterns

### The published `Stack` export is a card-pile that overlaps children by an offset — it does not do gap-based layout. Flex is the flex container.

**Bad:** `Expecting import { Stack } from '@cascivo/react' to gap items`  
**Good:** `Use Flex for gap-based layout (import { Flex } from "@cascivo/react", or `npx cascivo add flex`)`  
**Why:** The published `Stack` export is a card-pile that overlaps children by an offset — it does not do gap-based layout. Flex is the flex container.

## Related components

- **Stack** (alternative): The `@cascivo/react` `Stack` overlaps children with an offset (card-pile) — a different component for visual overlap, not gap-based layout.
- **Grid** (alternative): Use for two-dimensional row-and-column layouts
- **Columns** (alternative): Use for equal-width multi-column content

## Accessibility rationale

Pure layout primitive with no semantic role; does not affect the accessibility tree.

## Props

| Name        | Type                                  | Required | Default | Description        |
| ----------- | ------------------------------------- | -------- | ------- | ------------------ |
| `direction` | `'vertical' \| 'horizontal'`          | No       | —       | Flex direction     |
| `gap`       | `1\|2\|3\|4\|5\|6\|8\|10\|12`         | No       | —       | Spacing token step |
| `align`     | `'start'\|'center'\|'end'\|'stretch'` | No       | —       | align-items        |
| `justify`   | `'start'\|'center'\|'end'\|'between'` | No       | —       | justify-content    |
| `wrap`      | `boolean`                             | No       | —       | Allow wrapping     |

## Tokens

- `--cascivo-space-*`

## Examples

### Vertical

Default vertical stack

```jsx
<Flex gap={4}>
  <div>A</div>
  <div>B</div>
</Flex>
```

### Horizontal

Row layout

```jsx
<Flex direction="horizontal" gap={2}>
  <div>A</div>
  <div>B</div>
</Flex>
```

## AI context prompt

Copy this into an LLM context bar before editing this component:

```text
I am modifying the cascivo Flex component (layout). Flex layout primitive for vertical or horizontal stacking with gap control.

Architecture constraints — follow exactly:
- Signals only (useSignal/useComputed/useSignalEffect from @cascivo/core). Never useState/useEffect/useContext/useReducer.
- Style only through --cascivo-* custom properties. No Tailwind, no inline styles, no CSS-in-JS.
- Responsive via @container queries on the canonical scale (30rem/40rem/64rem/80rem). Do not use global viewport @media breakpoints.
- Visual states (hover/focus/active/disabled) via CSS pseudo-classes, not JS.
- CSS logical properties only (RTL-safe).

Flex is strictly bound to these tokens — use only these, do not invent token names:
  --cascivo-space-*

Accessibility: role "generic", WCAG 2.1-AA. Keep it AA.

Do not invent props, tokens, or global viewport media queries.
```
