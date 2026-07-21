# Center

**Category:** layout  
**Description:** Horizontally centered container with a configurable max-width.

## When to use

- Horizontally centering content within a configurable max-width
- Constraining page or section content to a readable measure

## When NOT to use

- Stacking children with consistent gaps — use Flex
- Multi-column or grid arrangements — use Columns or Grid

## Related components

- **Section** (contained-by): Sections use a centered inner width built on the same idea
- **Flex** (pairs-with): Stack the centered content vertically inside it with Flex

## Accessibility rationale

Pure layout wrapper with no semantic role; does not affect the accessibility tree.

## Props

| Name       | Type     | Required | Default | Description         |
| ---------- | -------- | -------- | ------- | ------------------- |
| `maxWidth` | `string` | No       | —       | CSS max-width value |

## Tokens

- `--cascivo-space-4`

## Examples

### Centered content

Centered container with custom max-width

```jsx
<Center maxWidth="60rem">
  <p>Content</p>
</Center>
```

## AI context prompt

Copy this into an LLM context bar before editing this component:

```text
I am modifying the cascivo Center component (layout). Horizontally centered container with a configurable max-width.

Architecture constraints — follow exactly:
- Signals only (useSignal/useComputed/useSignalEffect from @cascivo/core). Never useState/useEffect/useContext/useReducer.
- Style only through --cascivo-* custom properties. No Tailwind, no inline styles, no CSS-in-JS.
- Responsive via @container queries on the canonical scale (30rem/40rem/64rem/80rem). Do not use global viewport @media breakpoints.
- @container queries need an ancestor that establishes containment (container-type: inline-size). An element can never be its own query container, so a component whose own rule restyles itself via @container must render an outer wrapper that establishes the container (see Grid/Columns). Section and other layout wrappers already establish one for their descendants.
- Visual states (hover/focus/active/disabled) via CSS pseudo-classes, not JS.
- CSS logical properties only (RTL-safe).

Center is strictly bound to these tokens — use only these, do not invent token names:
  --cascivo-space-4

Accessibility: role "generic", WCAG 2.1-AA. Keep it AA.

Do not invent props, tokens, or global viewport media queries.
```
