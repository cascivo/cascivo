# Grid

**Category:** layout  
**Description:** CSS grid layout primitive with responsive column collapsing. Establishes its own containment, so responsive `cols` adapt to the grid’s own slot width with no wrapper or container ancestor required.

## When to use

- Two-dimensional layouts with an explicit column count
- Arranging cards or tiles that should align in rows and columns

## When NOT to use

- Single-direction stacking — use Stack
- Columns that auto-fit to available width — use AutoGrid

## Related components

- **AutoGrid** (alternative): Use when columns should auto-fill without fixed counts
- **Columns** (alternative): Use for equal-width text columns that collapse on narrow viewports

## Accessibility rationale

Pure layout primitive with no semantic role; does not affect the accessibility tree.

## Props

| Name      | Type                                                                              | Required | Default | Description                                                                                              |
| --------- | --------------------------------------------------------------------------------- | -------- | ------- | -------------------------------------------------------------------------------------------------------- |
| `cols`    | `number \| { base?: number; sm?: number; md?: number; lg?: number; xl?: number }` | No       | —       | Column count — a number, or a per-breakpoint object (base/sm/md/lg/xl) for responsive columns            |
| `gap`     | `1\|2\|3\|4\|5\|6\|8\|10\|12`                                                     | No       | —       | Spacing token step. Maps to the --cascivo-space-\* scale, which intentionally skips 7/9/11 — use 6 or 8. |
| `align`   | `'start' \| 'center' \| 'end' \| 'stretch'`                                       | No       | —       | Block-axis alignment of items within their cells (align-items); default stretch                          |
| `justify` | `'start' \| 'center' \| 'end' \| 'stretch'`                                       | No       | —       | Inline-axis alignment of items within their cells (justify-items); default stretch                       |
| `span`    | `number \| { base?: number; sm?: number; md?: number; lg?: number; xl?: number }` | No       | —       | GridItem: column span — a number, or a per-breakpoint object                                             |

## Tokens

- `--cascivo-space-*`

## Examples

### Basic grid

3-column grid with spanning item

```jsx
<Grid cols={3} gap={4}>
  <GridItem span={1}>A</GridItem>
  <GridItem span={2}>B</GridItem>
</Grid>
```

### Responsive dashboard grid

1 column on mobile, 2 on tablet, 3 on desktop; the first item spans 2 on desktop

```jsx
<Grid cols={{ base: 1, md: 2, lg: 3 }} gap={4}>
  <GridItem span={{ base: 1, lg: 2 }}>Wide</GridItem>
</Grid>
```

## AI context prompt

Copy this into an LLM context bar before editing this component:

```text
I am modifying the cascivo Grid component (layout). CSS grid layout primitive with responsive column collapsing. Establishes its own containment, so responsive `cols` adapt to the grid’s own slot width with no wrapper or container ancestor required.

Architecture constraints — follow exactly:
- Signals only (useSignal/useComputed/useSignalEffect from @cascivo/core). Never useState/useEffect/useContext/useReducer.
- Style only through --cascivo-* custom properties. No Tailwind, no inline styles, no CSS-in-JS.
- Responsive via @container queries on the canonical scale (30rem/40rem/64rem/80rem). Do not use global viewport @media breakpoints.
- @container queries need an ancestor that establishes containment (container-type: inline-size). An element can never be its own query container, so a component whose own rule restyles itself via @container must render an outer wrapper that establishes the container (see Grid/Columns). Section and other layout wrappers already establish one for their descendants.
- Visual states (hover/focus/active/disabled) via CSS pseudo-classes, not JS.
- CSS logical properties only (RTL-safe).

Grid is strictly bound to these tokens — use only these, do not invent token names:
  --cascivo-space-*

Accessibility: role "generic", WCAG 2.1-AA. Keep it AA.

Do not invent props, tokens, or global viewport media queries.
```
