# Flow

The declarative, AI-first flow surface — render a node/edge graph from plain serializable data.

## Install

Copy-paste the source (you own and can edit it):

```bash
npx cascivo add flow/flow
```

_Copy-paste only — this block/layout is not published as an importable package._

## Category

`display`

## Props

| Prop            | Type                               | Required             | Default                         | Description                               |
| --------------- | ---------------------------------- | -------------------- | ------------------------------- | ----------------------------------------- | --- | -------------------------------- |
| `nodes`         | `FlowNode[]`                       | yes                  | —                               | Initial nodes (serializable).             |
| `edges`         | `FlowEdge[]`                       | yes                  | —                               | Initial edges (serializable).             |
| `onNodesChange` | `(nodes: FlowNode[]) => void`      | no                   | —                               | —                                         |
| `onEdgesChange` | `(edges: FlowEdge[]) => void`      | no                   | —                               | —                                         |
| `onConnect`     | `(connection: Connection) => void` | no                   | —                               | —                                         |
| `nodeTypes`     | `Record<string, NodeRenderer>`     | no                   | —                               | Custom node renderers keyed by node.type. |
| `fitView`       | `boolean`                          | no                   | `true`                          | —                                         |
| `background`    | `boolean                           | FlowBackgroundProps` | no                              | `false`                                   | —   |
| `controls`      | `boolean`                          | no                   | `false`                         | —                                         |
| `minimap`       | `boolean`                          | no                   | `false`                         | —                                         |
| `layout`        | `'grid'                            | 'layered'            | ((nodes, edges) => FlowNode[])` | no                                        | —   | Optional dependency-free layout. |
| `className`     | `string`                           | no                   | —                               | —                                         |

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
