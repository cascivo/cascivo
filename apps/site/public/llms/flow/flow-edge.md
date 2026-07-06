# FlowEdge

An SVG edge with bezier/straight/smoothstep paths, an arrowhead, an optional label, and animation.

## Install

Copy-paste the source (you own and can edit it):

```bash
npx cascivo add flow/flow-edge
```

_Copy-paste only — this block/layout is not published as an importable package._

## Category

`display`

## Variants

- `bezier`
- `straight`
- `smoothstep`

## States

- `default`
- `selected`
- `animated`

## Props

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `sourceX` | `number` | yes | — | Source anchor x (flow coords). |
| `sourceY` | `number` | yes | — | Y coordinate of the edge’s source point. |
| `targetX` | `number` | yes | — | X coordinate of the edge’s target point. |
| `targetY` | `number` | yes | — | Y coordinate of the edge’s target point. |
| `type` | `'bezier' \| 'straight' \| 'smoothstep'` | no | `bezier` | Edge path style ('bezier' \| 'straight' \| 'smoothstep'). |
| `animated` | `boolean` | no | `false` | When true, animates the edge path (dashed flow). |
| `label` | `ReactNode` | no | — | Text label for the control. |
| `selected` | `boolean` | no | `false` | Whether the edge is rendered as selected. |
| `markerStart` | `boolean` | no | `false` | Arrowhead at the source (points back toward the source) — set both for bidirectional. |
| `markerEnd` | `boolean` | no | `true` | Arrowhead at the target. Set false for an undirected line. |
| `className` | `string` | no | — | Additional CSS class names merged onto the root element. |

## Examples

### Edge path types

Bezier, straight, smoothstep, and an animated edge.

```tsx
() => (
  <div style={{ position: 'relative', height: 220 }}>
    <FlowEdge sourceX={20} sourceY={30} targetX={260} targetY={30} type="bezier" label="bezier" />
    <FlowEdge sourceX={20} sourceY={90} targetX={260} targetY={90} type="smoothstep" label="step" />
    <FlowEdge sourceX={20} sourceY={150} targetX={260} targetY={150} animated label="animated" />
  </div>
)
```

### Arrow direction

Forward (default), backward, bidirectional, or undirected — via markerStart/markerEnd.

```tsx
() => (
  <div style={{ position: 'relative', height: 260 }}>
    <FlowEdge sourceX={20} sourceY={30} targetX={260} targetY={30} label="forward" />
    <FlowEdge sourceX={20} sourceY={90} targetX={260} targetY={90} markerEnd={false} markerStart label="backward" />
    <FlowEdge sourceX={20} sourceY={150} targetX={260} targetY={150} markerStart label="both" />
    <FlowEdge sourceX={20} sourceY={210} targetX={260} targetY={210} markerEnd={false} label="undirected" />
  </div>
)
```

## Design tokens

- `--cascivo-color-border-strong`
- `--cascivo-color-accent`
- `--cascivo-color-surface`

## Accessibility

- **WCAG level:** 2.1-AA
- **ARIA role:** `presentation`

## Dependencies

- `@cascivo/core`

## Tags

flow, edge, connector, animated, svg
