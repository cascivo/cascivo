# FlowCanvas

**Category:** display  
**Description:** The pan/zoom canvas pane — a single CSS-transformed layer driven by the viewport signal.

## When to use

- Hosting a hand-composed flow from low-level FlowNode/FlowEdge primitives
- When you need direct control of the viewport, pan, and zoom

## When NOT to use

- For the common case — prefer the declarative <Flow nodes edges /> instead

## Related components

- **Flow** (alternative): The declarative data-driven wrapper.
- **FlowBackground** (contains): A common child.

## Accessibility rationale

role="application" — the pane is an interactive canvas with pointer gestures.

## Props

| Name               | Type                                     | Required | Default | Description                                                                               |
| ------------------ | ---------------------------------------- | -------- | ------- | ----------------------------------------------------------------------------------------- |
| `children`         | `ReactNode`                              | No       | —       | Background, nodes, edges.                                                                 |
| `viewport`         | `{ x: number; y: number; zoom: number }` | No       | —       | Controlled viewport.                                                                      |
| `onViewportChange` | `(viewport: Viewport) => void`           | No       | —       | Viewport change callback.                                                                 |
| `minZoom`          | `number`                                 | No       | 0.2     | Lower bound for the viewport zoom level.                                                  |
| `maxZoom`          | `number`                                 | No       | 2       | Upper bound for the viewport zoom level.                                                  |
| `panOnDrag`        | `boolean`                                | No       | true    | Drag the empty pane to pan the viewport.                                                  |
| `zoomOnScroll`     | `boolean`                                | No       | true    | Wheel or pinch to zoom the viewport.                                                      |
| `fitView`          | `boolean`                                | No       | false   | Frame the whole graph once on mount.                                                      |
| `className`        | `string`                                 | No       | —       | Additional CSS class names merged onto the root element.                                  |
| `chrome`           | `ReactNode`                              | No       | —       | Screen-fixed overlay (controls, minimap, panels) — rendered outside the transformed pane. |
| `controller`       | `UseViewportReturn`                      | No       | —       | Use a viewport controller owned by a parent (e.g.                                         |
| `defaultViewport`  | `Viewport`                               | No       | —       | Initial viewport (x, y, zoom) when uncontrolled.                                          |
| `flow`             | `FlowStore`                              | No       | —       | Share an external store (e.g.                                                             |

## Object types

### `UseViewportReturn`

Shape of the `controller` prop.

| Field          | Type                                          | Required | Description                                                               |
| -------------- | --------------------------------------------- | -------- | ------------------------------------------------------------------------- |
| `containerRef` | `RefObject<HTMLDivElement \| null>`           | Yes      | Outer clipping container — attach for wheel + size measurement.           |
| `panHandleRef` | `RefObject<HTMLElement \| null>`              | Yes      | Background drag-surface (behind nodes) — the pan handle.                  |
| `viewport`     | `Signal<Viewport>`                            | Yes      | —                                                                         |
| `pan`          | `(dx: number, dy: number) => void`            | Yes      | Translate the viewport by a screen-space delta.                           |
| `zoomTo`       | `(zoom: number, center?: XYPosition) => void` | Yes      | Set zoom (clamped), optionally keeping `center` (container coords) fixed. |
| `zoomIn`       | `() => void`                                  | Yes      | —                                                                         |
| `zoomOut`      | `() => void`                                  | Yes      | —                                                                         |
| `fitView`      | `(size?: Size) => void`                       | Yes      | Frame all nodes.                                                          |

### `Viewport`

The pan/zoom state of the canvas pane.

| Field  | Type     | Required | Description |
| ------ | -------- | -------- | ----------- |
| `x`    | `number` | Yes      | —           |
| `y`    | `number` | Yes      | —           |
| `zoom` | `number` | Yes      | —           |

### `FlowStore`

Shape of the `flow` prop.

| Field         | Type                                             | Required | Description |
| ------------- | ------------------------------------------------ | -------- | ----------- |
| `nodes`       | `Signal<FlowNode[]>`                             | Yes      | —           |
| `edges`       | `Signal<FlowEdge[]>`                             | Yes      | —           |
| `viewport`    | `Signal<Viewport>`                               | Yes      | —           |
| `setNodes`    | `(nodes: FlowNode[]) => void`                    | Yes      | —           |
| `updateNode`  | `(id: string, patch: Partial<FlowNode>) => void` | Yes      | —           |
| `setEdges`    | `(edges: FlowEdge[]) => void`                    | Yes      | —           |
| `addEdge`     | `(edge: FlowEdge) => void`                       | Yes      | —           |
| `setViewport` | `(viewport: Viewport) => void`                   | Yes      | —           |

## Tokens

- `--cascivo-color-bg`
- `--cascivo-radius-surface`

## Examples

### Empty canvas with a background

```jsx
;() => (
  <FlowCanvas style={{ height: 240 }}>
    <FlowBackground />
  </FlowCanvas>
)
```

## Boundaries

| Area     | Level    | Note                               |
| -------- | -------- | ---------------------------------- |
| viewport | flexible | Controllable; pan/zoom toggleable. |

## AI context prompt

Copy this into an LLM context bar before editing this component:

```text
I am modifying the cascivo FlowCanvas component (display). The pan/zoom canvas pane — a single CSS-transformed layer driven by the viewport signal.

Architecture constraints — follow exactly:
- Signals only (useSignal/useComputed/useSignalEffect from @cascivo/core). Never useState/useEffect/useContext/useReducer.
- Style only through --cascivo-* custom properties. No Tailwind, no inline styles, no CSS-in-JS.
- Responsive via @container queries on the canonical scale (30rem/40rem/64rem/80rem). Do not use global viewport @media breakpoints.
- @container queries need an ancestor that establishes containment (container-type: inline-size). An element can never be its own query container, so a component whose own rule restyles itself via @container must render an outer wrapper that establishes the container (see Grid/Columns). Section and other layout wrappers already establish one for their descendants.
- Visual states (hover/focus/active/disabled) via CSS pseudo-classes, not JS.
- CSS logical properties only (RTL-safe).

FlowCanvas is strictly bound to these tokens — use only these, do not invent token names:
  --cascivo-color-bg, --cascivo-radius-surface

Accessibility: role "application", WCAG 2.1-AA, keyboard: Tab (focus)/Drag (pan)/Wheel (zoom). Keep it AA.
Flexible: viewport.

Do not invent props, tokens, or global viewport media queries.
```
