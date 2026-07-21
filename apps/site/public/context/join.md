# Join

**Category:** layout  
**Description:** Groups adjacent children into a seamless joined element by removing interior borders and radii

## When to use

- Input + button search groups where the two controls should appear as one unit
- Segmented button rows where buttons share borders

## When NOT to use

- Independent adjacent buttons that should remain visually separate
- SegmentedControl — it has its own built-in grouping and selection semantics

## Related components

- **SegmentedControl** (alternative): SegmentedControl has built-in selection state; Join is purely a layout wrapper
- **InputGroup** (alternative): InputGroup handles input + addon joining; Join is the general-purpose grouping primitive

## Accessibility rationale

Join is a layout-only container (role="none"). Accessibility semantics belong on the individual child controls — buttons carry their own role, inputs their labels.

## Props

| Name | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `children` | `React.ReactNode` | Yes | — | Content rendered inside the component. |
| `orientation` | `'horizontal' \| 'vertical'` | No | horizontal | Layout orientation of the component. |
| `className` | `string` | No | — | Additional CSS class names merged onto the root element. |

## Examples

### Search group

Input and button joined into a single search control

```jsx
<Join><Input placeholder="Search…" /><Button>Go</Button></Join>
```

### Segmented buttons

Segmented button row with no gaps between items

```jsx
<Join><Button variant="secondary">Day</Button><Button variant="secondary">Week</Button><Button variant="secondary">Month</Button></Join>
```

### Vertical stack

Vertically joined button group

```jsx
<Join orientation="vertical"><Button>Top</Button><Button>Middle</Button><Button>Bottom</Button></Join>
```

## Boundaries

| Area | Level | Note |
|------|-------|------|
| orientation | flexible | Horizontal and vertical grouping are both supported via the orientation prop |

## AI context prompt

Copy this into an LLM context bar before editing this component:

```text
I am modifying the cascivo Join component (layout). Groups adjacent children into a seamless joined element by removing interior borders and radii

Architecture constraints — follow exactly:
- Signals only (useSignal/useComputed/useSignalEffect from @cascivo/core). Never useState/useEffect/useContext/useReducer.
- Style only through --cascivo-* custom properties. No Tailwind, no inline styles, no CSS-in-JS.
- Responsive via @container queries on the canonical scale (30rem/40rem/64rem/80rem). Do not use global viewport @media breakpoints.
- @container queries need an ancestor that establishes containment (container-type: inline-size). An element can never be its own query container, so a component whose own rule restyles itself via @container must render an outer wrapper that establishes the container (see Grid/Columns). Section and other layout wrappers already establish one for their descendants.
- Visual states (hover/focus/active/disabled) via CSS pseudo-classes, not JS.
- CSS logical properties only (RTL-safe).

Join is strictly bound to these tokens — use only these, do not invent token names:
  none declared

Accessibility: role "none", WCAG 2.2-AA. Keep it AA.
Flexible: orientation.

Do not invent props, tokens, or global viewport media queries.
```
