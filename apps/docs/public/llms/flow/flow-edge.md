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

| Prop        | Type        | Required   | Default       | Description                    |
| ----------- | ----------- | ---------- | ------------- | ------------------------------ | -------- | --- |
| `sourceX`   | `number`    | yes        | —             | Source anchor x (flow coords). |
| `sourceY`   | `number`    | yes        | —             | —                              |
| `targetX`   | `number`    | yes        | —             | —                              |
| `targetY`   | `number`    | yes        | —             | —                              |
| `type`      | `'bezier'   | 'straight' | 'smoothstep'` | no                             | `bezier` | —   |
| `animated`  | `boolean`   | no         | `false`       | —                              |
| `label`     | `ReactNode` | no         | —             | —                              |
| `selected`  | `boolean`   | no         | `false`       | —                              |
| `markerEnd` | `boolean`   | no         | `true`        | —                              |
| `className` | `string`    | no         | —             | —                              |

## Examples

### Edge path types

Bezier, straight, smoothstep, and an animated edge.

```tsx
;() => (
  <div style={{ position: 'relative', height: 220 }}>
    <FlowEdge sourceX={20} sourceY={30} targetX={260} targetY={30} type="bezier" label="bezier" />
    <FlowEdge sourceX={20} sourceY={90} targetX={260} targetY={90} type="smoothstep" label="step" />
    <FlowEdge sourceX={20} sourceY={150} targetX={260} targetY={150} animated label="animated" />
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
