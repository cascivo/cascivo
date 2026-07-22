# Flow

**Category:** display  
**Description:** The declarative, AI-first flow surface — render a node/edge graph from plain serializable data.

## When to use

- Rendering a graph from data — the common case and the agent-emittable surface
- Flowcharts, DAGs, pipelines, and mind-maps from plain nodes/edges arrays

## When NOT to use

- A scripted, sequenced walkthrough — use FlowStory
- Heavy graph editing (undo/redo, resize/rotate) — out of scope

## Anti-patterns

### Declarative serializable data is what an agent can emit and what stays in sync with props.

**Bad:** `Imperatively building the graph with graph.addNode(...)`  
**Good:** `<Flow nodes={…} edges={…} />`  
**Why:** Declarative serializable data is what an agent can emit and what stays in sync with props.

## Related components

- **FlowStory** (alternative): Scripted, captioned storyline animation.
- **FlowNode** (contains): Renders a node per entry.
- **FlowEdge** (contains): Renders an edge per entry.

## Accessibility rationale

role="application" canvas; nodes are focusable groups; controls are real i18n-labeled buttons.

## Props

| Name | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `nodes` | `FlowNode[]` | Yes | — | Initial nodes (serializable). |
| `edges` | `FlowEdge[]` | Yes | — | Initial edges (serializable). |
| `onNodesChange` | `(nodes: FlowNode[]) => void` | No | — | Called with the next nodes when they change (drag, add, remove). |
| `onEdgesChange` | `(edges: FlowEdge[]) => void` | No | — | Called with the next edges when they change. |
| `onConnect` | `(connection: Connection) => void` | No | — | Called when two handles are connected to form a new edge. |
| `nodeTypes` | `Record<string, NodeRenderer>` | No | — | Custom node renderers keyed by node.type. |
| `fitView` | `boolean` | No | true | When true, fits the graph to the viewport on mount. |
| `background` | `boolean \| FlowBackgroundProps` | No | false | Background pattern — true for the default dots, or a config object. |
| `controls` | `boolean` | No | false | Whether to show the controls. |
| `minimap` | `boolean` | No | false | When true, shows the minimap overlay. |
| `layout` | `'grid' \| 'layered' \| ((nodes, edges) => FlowNode[])` | No | — | Optional dependency-free layout. |
| `interactive` | `boolean` | No | true | When false (view mode), nodes cannot be selected, dragged, or connected and handles are hidden; pan/zoom still work. |
| `className` | `string` | No | — | Additional CSS class names merged onto the root element. |

## Tokens

- `--cascivo-color-bg`
- `--cascivo-color-surface`
- `--cascivo-color-accent`

## Examples

### Declarative pipeline

A flow from plain serializable data, with background, controls, and an animated edge.

```jsx
() => (
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

```jsx
() => (
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

## Boundaries

| Area | Level | Note |
|------|-------|------|
| rendering | flexible | Custom node renderers via nodeTypes. |
| layout | flexible | grid \| layered \| bring-your-own positions. |
| chrome | flexible | Optional background / controls / minimap. |

## AI context prompt

Copy this into an LLM context bar before editing this component:

```text
I am modifying the cascivo Flow component (display). The declarative, AI-first flow surface — render a node/edge graph from plain serializable data.

Architecture constraints — follow exactly:
- Signals only (useSignal/useComputed/useSignalEffect from @cascivo/core). Never useState/useEffect/useContext/useReducer.
- Style only through --cascivo-* custom properties. No Tailwind, no inline styles, no CSS-in-JS.
- Responsive via @container queries on the canonical scale (30rem/40rem/64rem/80rem). Do not use global viewport @media breakpoints.
- @container queries need an ancestor that establishes containment (container-type: inline-size). An element can never be its own query container, so a component whose own rule restyles itself via @container must render an outer wrapper that establishes the container (see Grid/Columns). Section and other layout wrappers already establish one for their descendants.
- Visual states (hover/focus/active/disabled) via CSS pseudo-classes, not JS.
- CSS logical properties only (RTL-safe).

Flow is strictly bound to these tokens — use only these, do not invent token names:
  --cascivo-color-bg, --cascivo-color-surface, --cascivo-color-accent

Accessibility: role "application", WCAG 2.1-AA, keyboard: Tab (focus nodes)/Enter/Space (select)/Drag (pan/move)/Wheel (zoom). Keep it AA.
Flexible: rendering, layout, chrome.

Do not invent props, tokens, or global viewport media queries.
```
