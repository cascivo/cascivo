import { Flow, type FlowEdgeData, type FlowNodeData } from '@cascivo/flow'

// A small, real graph — the cascivo AI pipeline — shown live: pan, zoom, drag a
// node, follow the animated edge. Plain serializable data, the shape an agent
// would emit. `layout="layered"` arranges it left-to-right from the edges.
const nodes: FlowNodeData[] = [
  { id: 'manifest', position: { x: 0, y: 0 }, data: { label: 'component.meta' } },
  { id: 'registry', position: { x: 0, y: 0 }, data: { label: 'registry.json' } },
  { id: 'mcp', position: { x: 0, y: 0 }, data: { label: 'MCP server' } },
  { id: 'agent', position: { x: 0, y: 0 }, data: { label: 'Your agent' } },
  { id: 'ui', position: { x: 0, y: 0 }, data: { label: 'Real UI' } },
]

const edges: FlowEdgeData[] = [
  { id: 'm-r', source: 'manifest', target: 'registry', animated: true },
  { id: 'r-mcp', source: 'registry', target: 'mcp', animated: true },
  { id: 'mcp-a', source: 'mcp', target: 'agent', animated: true },
  { id: 'a-ui', source: 'agent', target: 'ui', animated: true, label: 'builds' },
]

export function FlowHighlight() {
  return (
    <section id="flow" className="section highlight-section" aria-label="Flow" data-reveal="">
      <p className="guides-eyebrow">@cascivo/flow</p>
      <h2>Diagrams as data. Pan, zoom, connect.</h2>
      <p className="section-sub">
        <code>@cascivo/flow</code> renders node/edge graphs from plain serializable data — with
        pan/zoom, draggable nodes, animated edges, and scripted storylines. CSS-native,
        signal-driven, zero dependencies. Drag a node or scroll to zoom.
      </p>

      <div className="highlight-canvas">
        <Flow
          nodes={nodes}
          edges={edges}
          layout="layered"
          background
          controls
          fitView
          className="highlight-flow"
        />
      </div>

      <p className="icon-showcase-cta">
        <a href="https://docs.cascivo.com">Read the flow docs →</a>
      </p>
    </section>
  )
}
