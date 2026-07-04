# FlowEdge

**Category:** display  
**Description:** An SVG edge with bezier/straight/smoothstep paths, an arrowhead, an optional label, and animation.

## When to use

- Connecting two nodes with a directed path and arrowhead
- Animating flow direction along a connection ("marching ants")

## When NOT to use

- For undirected relationships where an arrowhead would mislead — set markerEnd={false}

## Anti-patterns

### The compositor animates CSS for free; a JS loop re-renders every frame.

**Bad:** `A requestAnimationFrame loop to animate the dash`  
**Good:** `A CSS stroke-dashoffset keyframe`  
**Why:** The compositor animates CSS for free; a JS loop re-renders every frame.

## Related components

- **FlowNode** (pairs-with): Edges connect nodes.
- **FlowStory** (pairs-with): Storylines animate edges in sequence.

## Accessibility rationale

Decorative SVG (aria-hidden); animation is disabled under prefers-reduced-motion.

## Props

| Name          | Type                                     | Required | Default | Description                                                                           |
| ------------- | ---------------------------------------- | -------- | ------- | ------------------------------------------------------------------------------------- |
| `sourceX`     | `number`                                 | Yes      | —       | Source anchor x (flow coords).                                                        |
| `sourceY`     | `number`                                 | Yes      | —       | Y coordinate of the edge’s source point.                                              |
| `targetX`     | `number`                                 | Yes      | —       | X coordinate of the edge’s target point.                                              |
| `targetY`     | `number`                                 | Yes      | —       | Y coordinate of the edge’s target point.                                              |
| `type`        | `'bezier' \| 'straight' \| 'smoothstep'` | No       | bezier  | Edge path style ('bezier' \| 'straight' \| 'smoothstep').                             |
| `animated`    | `boolean`                                | No       | false   | When true, animates the edge path (dashed flow).                                      |
| `label`       | `ReactNode`                              | No       | —       | Text label for the control.                                                           |
| `selected`    | `boolean`                                | No       | false   | Whether the edge is rendered as selected.                                             |
| `markerStart` | `boolean`                                | No       | false   | Arrowhead at the source (points back toward the source) — set both for bidirectional. |
| `markerEnd`   | `boolean`                                | No       | true    | Arrowhead at the target. Set false for an undirected line.                            |
| `className`   | `string`                                 | No       | —       | Additional CSS class names merged onto the root element.                              |

## Tokens

- `--cascivo-color-border-strong`
- `--cascivo-color-accent`
- `--cascivo-color-surface`

## Examples

### Edge path types

Bezier, straight, smoothstep, and an animated edge.

```jsx
;() => (
  <div style={{ position: 'relative', height: 220 }}>
    <FlowEdge sourceX={20} sourceY={30} targetX={260} targetY={30} type="bezier" label="bezier" />
    <FlowEdge sourceX={20} sourceY={90} targetX={260} targetY={90} type="smoothstep" label="step" />
    <FlowEdge sourceX={20} sourceY={150} targetX={260} targetY={150} animated label="animated" />
  </div>
)
```

### Arrow direction

Forward (default), backward, bidirectional, or undirected — via markerStart/markerEnd.

```jsx
;() => (
  <div style={{ position: 'relative', height: 260 }}>
    <FlowEdge sourceX={20} sourceY={30} targetX={260} targetY={30} label="forward" />
    <FlowEdge
      sourceX={20}
      sourceY={90}
      targetX={260}
      targetY={90}
      markerEnd={false}
      markerStart
      label="backward"
    />
    <FlowEdge sourceX={20} sourceY={150} targetX={260} targetY={150} markerStart label="both" />
    <FlowEdge
      sourceX={20}
      sourceY={210}
      targetX={260}
      targetY={210}
      markerEnd={false}
      label="undirected"
    />
  </div>
)
```

## Boundaries

| Area      | Level    | Note                              |
| --------- | -------- | --------------------------------- |
| path      | flexible | bezier \| straight \| smoothstep. |
| animation | flexible | Optional, reduced-motion-safe.    |

## AI context prompt

Copy this into an LLM context bar before editing this component:

```text
I am modifying the cascivo FlowEdge component (display). An SVG edge with bezier/straight/smoothstep paths, an arrowhead, an optional label, and animation.

Architecture constraints — follow exactly:
- Signals only (useSignal/useComputed/useSignalEffect from @cascivo/core). Never useState/useEffect/useContext/useReducer.
- Style only through --cascivo-* custom properties. No Tailwind, no inline styles, no CSS-in-JS.
- Responsive via @container queries on the canonical scale (30rem/40rem/64rem/80rem). Do not use global viewport @media breakpoints.
- Visual states (hover/focus/active/disabled) via CSS pseudo-classes, not JS.
- CSS logical properties only (RTL-safe).

FlowEdge is strictly bound to these tokens — use only these, do not invent token names:
  --cascivo-color-border-strong, --cascivo-color-accent, --cascivo-color-surface

Accessibility: role "presentation", WCAG 2.1-AA. Keep it AA.
Flexible: path, animation.

Do not invent props, tokens, or global viewport media queries.
```
