# Section

**Category:** layout  
**Description:** Page-section shell with block padding, centered inner width, and stack gap.

## When to use

- Wrapping a page region with block padding and a centered inner width
- The default container for stacking content within a page

## When NOT to use

- Just centering a single element — use Center
- A marketing band with built-in CTA content — use Cta or Hero

## Related components

- **Center** (contains): Uses centered inner width internally
- **PageHeader** (pairs-with): Pair sections below a page header

## Accessibility rationale

Renders a section element to group related content for screen readers.

## Props

| Name    | Type                            | Required | Default   | Description                                           |
| ------- | ------------------------------- | -------- | --------- | ----------------------------------------------------- |
| `width` | `"content" \| "wide" \| "full"` | No       | "content" | Max inline size: content=72rem, wide=90rem, full=none |
| `gap`   | `1\|2\|3\|4\|5\|6\|8\|10\|12`   | No       | 8         | Stack gap between children (spacing token step)       |

## Tokens

- `--cascivo-space-*`

## Examples

### Content section

Centered 72rem content column with 2rem block padding

```jsx
<Section width="content" gap={8}>
  <h2>Heading</h2>
  <p>Body copy.</p>
</Section>
```

## AI context prompt

Copy this into an LLM context bar before editing this component:

```text
I am modifying the cascivo Section component (layout). Page-section shell with block padding, centered inner width, and stack gap.

Architecture constraints — follow exactly:
- Signals only (useSignal/useComputed/useSignalEffect from @cascivo/core). Never useState/useEffect/useContext/useReducer.
- Style only through --cascivo-* custom properties. No Tailwind, no inline styles, no CSS-in-JS.
- Responsive via @container queries on the canonical scale (30rem/40rem/64rem/80rem). Do not use global viewport @media breakpoints.
- Visual states (hover/focus/active/disabled) via CSS pseudo-classes, not JS.
- CSS logical properties only (RTL-safe).

Section is strictly bound to these tokens — use only these, do not invent token names:
  --cascivo-space-*

Accessibility: role "region", WCAG 2.1-AA. Keep it AA.

Do not invent props, tokens, or global viewport media queries.
```
