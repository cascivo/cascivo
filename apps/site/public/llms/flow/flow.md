# Flow

The declarative, AI-first flow surface — render a node/edge graph from plain serializable data.

## Install

Ships in the `@cascivo/flow` package — install it (no copy-paste):

```sh
pnpm add @cascivo/flow
```

```tsx
import { Flow } from '@cascivo/flow'
import '@cascivo/flow/styles.css' // required stylesheet
```

## Category

`display`

## Props

| Prop              | Type                                                    | Required | Default | Description                                                                                                          |
| ----------------- | ------------------------------------------------------- | -------- | ------- | -------------------------------------------------------------------------------------------------------------------- |
| `nodes`           | `FlowNode[]`                                            | yes      | —       | Initial nodes (serializable).                                                                                        |
| `edges`           | `FlowEdge[]`                                            | yes      | —       | Initial edges (serializable).                                                                                        |
| `onNodesChange`   | `(nodes: FlowNode[]) => void`                           | no       | —       | Called with the next nodes when they change (drag, add, remove).                                                     |
| `onEdgesChange`   | `(edges: FlowEdge[]) => void`                           | no       | —       | Called with the next edges when they change.                                                                         |
| `onConnect`       | `(connection: Connection) => void`                      | no       | —       | Called when two handles are connected to form a new edge.                                                            |
| `nodeTypes`       | `Record<string, NodeRenderer>`                          | no       | —       | Custom node renderers keyed by node.type.                                                                            |
| `fitView`         | `boolean`                                               | no       | `true`  | When true, fits the graph to the viewport on mount.                                                                  |
| `background`      | `boolean \| FlowBackgroundProps`                        | no       | `false` | Background pattern — true for the default dots, or a config object.                                                  |
| `controls`        | `boolean`                                               | no       | `false` | Whether to show the controls.                                                                                        |
| `minimap`         | `boolean`                                               | no       | `false` | When true, shows the minimap overlay.                                                                                |
| `layout`          | `'grid' \| 'layered' \| ((nodes, edges) => FlowNode[])` | no       | —       | Optional dependency-free layout.                                                                                     |
| `interactive`     | `boolean`                                               | no       | `true`  | When false (view mode), nodes cannot be selected, dragged, or connected and handles are hidden; pan/zoom still work. |
| `className`       | `string`                                                | no       | —       | Additional CSS class names merged onto the root element.                                                             |
| `activeDirection` | `'forward' \| 'reverse' \| undefined`                   | no       | —       | Direction the active edge's dash travels.                                                                            |
| `activeEdgeId`    | `string \| undefined`                                   | no       | —       | Highlight + animate a single edge (used by FlowStory's active step).                                                 |
| `maxZoom`         | `number`                                                | no       | —       | Maximum zoom scale the viewport can reach.                                                                           |
| `minZoom`         | `number`                                                | no       | —       | Minimum zoom scale the viewport can reach.                                                                           |

## Object types

### `FlowNode`

A graph node. Positioned in flow coordinates; renders as themed HTML.

| Field      | Type         | Required | Description                                                      |
| ---------- | ------------ | -------- | ---------------------------------------------------------------- |
| `id`       | `string`     | yes      | —                                                                |
| `position` | `XYPosition` | yes      | —                                                                |
| `data`     | `Data`       | no       | —                                                                |
| `type`     | `string`     | no       | Custom renderer key resolved via `nodeTypes`.                    |
| `selected` | `boolean`    | no       | —                                                                |
| `width`    | `number`     | no       | Explicit/measured size used for handle anchors + bounding boxes. |
| `height`   | `number`     | no       | —                                                                |

### `FlowEdge`

A directed connection between two nodes' handles.

| Field          | Type                     | Required | Description                                                                 |
| -------------- | ------------------------ | -------- | --------------------------------------------------------------------------- |
| `id`           | `string`                 | yes      | —                                                                           |
| `source`       | `string`                 | yes      | —                                                                           |
| `target`       | `string`                 | yes      | —                                                                           |
| `sourceHandle` | `string`                 | no       | —                                                                           |
| `targetHandle` | `string`                 | no       | —                                                                           |
| `type`         | `EdgePathType \| string` | no       | Custom renderer key resolved via `edgeTypes`.                               |
| `animated`     | `boolean`                | no       | —                                                                           |
| `label`        | `string`                 | no       | —                                                                           |
| `selected`     | `boolean`                | no       | —                                                                           |
| `markerStart`  | `boolean`                | no       | Arrowhead at the source end (points back toward the source). Default false. |
| `markerEnd`    | `boolean`                | no       | Arrowhead at the target end (points at the target). Default true.           |

## Examples

### Declarative pipeline

A flow from plain serializable data, with background, controls, and an animated edge.

```tsx
;() => (
  <Flow
    style={{ height: 280 }}
    background
    controls
    nodes={[
      { id: 'a', position: { x: 0, y: 60 }, data: { label: 'Client' } },
      { id: 'b', position: { x: 240, y: 60 }, data: { label: 'Gateway' } },
      { id: 'c', position: { x: 480, y: 60 }, data: { label: 'Service' } },
    ]}
    edges={[
      { id: 'ab', source: 'a', target: 'b', animated: true, label: 'request' },
      { id: 'bc', source: 'b', target: 'c' },
    ]}
  />
)
```

### Layered layout

Let the dependency-free layered layout arrange a small DAG.

```tsx
;() => (
  <Flow
    style={{ height: 300 }}
    layout="layered"
    background
    minimap
    nodes={[
      { id: 'a', position: { x: 0, y: 0 }, data: { label: 'Ingest' } },
      { id: 'b', position: { x: 0, y: 0 }, data: { label: 'Transform' } },
      { id: 'c', position: { x: 0, y: 0 }, data: { label: 'Validate' } },
      { id: 'd', position: { x: 0, y: 0 }, data: { label: 'Load' } },
    ]}
    edges={[
      { id: 'ab', source: 'a', target: 'b' },
      { id: 'ac', source: 'a', target: 'c' },
      { id: 'bd', source: 'b', target: 'd' },
      { id: 'cd', source: 'c', target: 'd' },
    ]}
  />
)
```

## Design tokens

- `--cascivo-color-bg`
- `--cascivo-color-surface`
- `--cascivo-color-accent`

## Accessibility

- **WCAG level:** 2.1-AA
- **ARIA role:** `application`
- **Keyboard:** Tab (focus nodes), Enter/Space (select), Drag (pan/move), Wheel (zoom)

## Dependencies

- `@cascivo/core`

## Tags

flow, graph, declarative, diagram, ai-first

---

_Generated from registry v0.17.0 on 2026-08-11. Docs track `main`; compare with https://cascivo.com/registry.json `.version`._
