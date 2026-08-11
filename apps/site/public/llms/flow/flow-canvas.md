# FlowCanvas

The pan/zoom canvas pane — a single CSS-transformed layer driven by the viewport signal.

## Install

Ships in the `@cascivo/flow` package — install it (no copy-paste):

```sh
pnpm add @cascivo/flow
```

```tsx
import { FlowCanvas } from '@cascivo/flow'
import '@cascivo/flow/styles.css' // required stylesheet
```

## Category

`display`

## Props

| Prop               | Type                                     | Required | Default | Description                                                                               |
| ------------------ | ---------------------------------------- | -------- | ------- | ----------------------------------------------------------------------------------------- |
| `children`         | `ReactNode`                              | no       | —       | Background, nodes, edges.                                                                 |
| `viewport`         | `{ x: number; y: number; zoom: number }` | no       | —       | Controlled viewport.                                                                      |
| `onViewportChange` | `(viewport: Viewport) => void`           | no       | —       | Viewport change callback.                                                                 |
| `minZoom`          | `number`                                 | no       | `0.2`   | Lower bound for the viewport zoom level.                                                  |
| `maxZoom`          | `number`                                 | no       | `2`     | Upper bound for the viewport zoom level.                                                  |
| `panOnDrag`        | `boolean`                                | no       | `true`  | Drag the empty pane to pan the viewport.                                                  |
| `zoomOnScroll`     | `boolean`                                | no       | `true`  | Wheel or pinch to zoom the viewport.                                                      |
| `fitView`          | `boolean`                                | no       | `false` | Frame the whole graph once on mount.                                                      |
| `className`        | `string`                                 | no       | —       | Additional CSS class names merged onto the root element.                                  |
| `chrome`           | `ReactNode`                              | no       | —       | Screen-fixed overlay (controls, minimap, panels) — rendered outside the transformed pane. |
| `controller`       | `UseViewportReturn`                      | no       | —       | Use a viewport controller owned by a parent (e.g.                                         |
| `defaultViewport`  | `Viewport`                               | no       | —       | Initial viewport (x, y, zoom) when uncontrolled.                                          |
| `flow`             | `FlowStore`                              | no       | —       | Share an external store (e.g.                                                             |

## Object types

### `UseViewportReturn`

Shape of the `controller` prop.

| Field          | Type                                          | Required | Description                                                               |
| -------------- | --------------------------------------------- | -------- | ------------------------------------------------------------------------- |
| `containerRef` | `RefObject<HTMLDivElement \| null>`           | yes      | Outer clipping container — attach for wheel + size measurement.           |
| `panHandleRef` | `RefObject<HTMLElement \| null>`              | yes      | Background drag-surface (behind nodes) — the pan handle.                  |
| `viewport`     | `Signal<Viewport>`                            | yes      | —                                                                         |
| `pan`          | `(dx: number, dy: number) => void`            | yes      | Translate the viewport by a screen-space delta.                           |
| `zoomTo`       | `(zoom: number, center?: XYPosition) => void` | yes      | Set zoom (clamped), optionally keeping `center` (container coords) fixed. |
| `zoomIn`       | `() => void`                                  | yes      | —                                                                         |
| `zoomOut`      | `() => void`                                  | yes      | —                                                                         |
| `fitView`      | `(size?: Size) => void`                       | yes      | Frame all nodes.                                                          |

### `Viewport`

The pan/zoom state of the canvas pane.

| Field  | Type     | Required | Description |
| ------ | -------- | -------- | ----------- |
| `x`    | `number` | yes      | —           |
| `y`    | `number` | yes      | —           |
| `zoom` | `number` | yes      | —           |

### `FlowStore`

Shape of the `flow` prop.

| Field         | Type                                             | Required | Description |
| ------------- | ------------------------------------------------ | -------- | ----------- |
| `nodes`       | `Signal<FlowNode[]>`                             | yes      | —           |
| `edges`       | `Signal<FlowEdge[]>`                             | yes      | —           |
| `viewport`    | `Signal<Viewport>`                               | yes      | —           |
| `setNodes`    | `(nodes: FlowNode[]) => void`                    | yes      | —           |
| `updateNode`  | `(id: string, patch: Partial<FlowNode>) => void` | yes      | —           |
| `setEdges`    | `(edges: FlowEdge[]) => void`                    | yes      | —           |
| `addEdge`     | `(edge: FlowEdge) => void`                       | yes      | —           |
| `setViewport` | `(viewport: Viewport) => void`                   | yes      | —           |

## Examples

### Empty canvas with a background

```tsx
;() => (
  <FlowCanvas style={{ height: 240 }}>
    <FlowBackground />
  </FlowCanvas>
)
```

## Design tokens

- `--cascivo-color-bg`
- `--cascivo-radius-surface`

## Accessibility

- **WCAG level:** 2.1-AA
- **ARIA role:** `application`
- **Keyboard:** Tab (focus), Drag (pan), Wheel (zoom)

## Dependencies

- `@cascivo/core`

## Tags

flow, canvas, viewport, pan, zoom

---

_Generated from registry v0.17.0 on 2026-08-11. Docs track `main`; compare with https://cascivo.com/registry.json `.version`._
