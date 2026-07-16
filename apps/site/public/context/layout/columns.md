# Columns

**Category:** layout  
**Description:** Equal-width multi-column layout that collapses to single column on narrow viewports.

## When to use

- Equal-width multi-column content that collapses to one column when narrow
- Side-by-side text or content blocks at a fixed column count

## When NOT to use

- Card grids that auto-fit to width — use AutoGrid
- Single-direction stacking — use Flex

## Related components

- **Grid** (alternative): Use for general two-dimensional grid placement
- **AutoGrid** (alternative): Use when column count should adapt to available width

## Accessibility rationale

Pure layout primitive with no semantic role; does not affect the accessibility tree.

## Props

| Name    | Type                          | Required | Default | Description             |
| ------- | ----------------------------- | -------- | ------- | ----------------------- |
| `count` | `2\|3\|4`                     | No       | —       | Number of equal columns |
| `gap`   | `1\|2\|3\|4\|5\|6\|8\|10\|12` | No       | —       | Spacing token step      |

## Tokens

- `--cascivo-space-*`

## Examples

### Three columns

Three equal columns

```jsx
<Columns count={3}>
  <div>A</div>
  <div>B</div>
  <div>C</div>
</Columns>
```

## AI context prompt

Copy this into an LLM context bar before editing this component:

```text
I am modifying the cascivo Columns component (layout). Equal-width multi-column layout that collapses to single column on narrow viewports.

Architecture constraints — follow exactly:
- Signals only (useSignal/useComputed/useSignalEffect from @cascivo/core). Never useState/useEffect/useContext/useReducer.
- Style only through --cascivo-* custom properties. No Tailwind, no inline styles, no CSS-in-JS.
- Responsive via @container queries on the canonical scale (30rem/40rem/64rem/80rem). Do not use global viewport @media breakpoints.
- @container queries need an ancestor that establishes containment (container-type: inline-size). An element can never be its own query container, so a component whose own rule restyles itself via @container must render an outer wrapper that establishes the container (see Grid/Columns). Section and other layout wrappers already establish one for their descendants.
- Visual states (hover/focus/active/disabled) via CSS pseudo-classes, not JS.
- CSS logical properties only (RTL-safe).

Columns is strictly bound to these tokens — use only these, do not invent token names:
  --cascivo-space-*

Accessibility: role "generic", WCAG 2.1-AA. Keep it AA.

Do not invent props, tokens, or global viewport media queries.
```
