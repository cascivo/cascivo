import { Flow, FlowStory } from '@cascivo/flow'

const pipelineNodes = [
  { id: 'client', position: { x: 0, y: 80 }, data: { label: 'Client' } },
  { id: 'gateway', position: { x: 240, y: 80 }, data: { label: 'Gateway' } },
  { id: 'service', position: { x: 480, y: 80 }, data: { label: 'Service' } },
]
const pipelineEdges = [
  { id: 'cg', source: 'client', target: 'gateway', animated: true, label: 'request' },
  { id: 'gs', source: 'gateway', target: 'service' },
]

const edgeTypeNodes = [
  { id: 'a1', position: { x: 0, y: 0 }, data: { label: 'A' } },
  { id: 'b1', position: { x: 280, y: 0 }, data: { label: 'B' } },
  { id: 'a2', position: { x: 0, y: 90 }, data: { label: 'A' } },
  { id: 'b2', position: { x: 280, y: 90 }, data: { label: 'B' } },
  { id: 'a3', position: { x: 0, y: 180 }, data: { label: 'A' } },
  { id: 'b3', position: { x: 280, y: 180 }, data: { label: 'B' } },
]
const edgeTypeEdges = [
  { id: 'e1', source: 'a1', target: 'b1', type: 'bezier', label: 'bezier' },
  { id: 'e2', source: 'a2', target: 'b2', type: 'smoothstep', label: 'smoothstep' },
  { id: 'e3', source: 'a3', target: 'b3', type: 'straight', label: 'straight', animated: true },
]

const arrowNodes = [
  { id: 'f1', position: { x: 0, y: 0 }, data: { label: 'A' } },
  { id: 'g1', position: { x: 280, y: 0 }, data: { label: 'B' } },
  { id: 'f2', position: { x: 0, y: 90 }, data: { label: 'A' } },
  { id: 'g2', position: { x: 280, y: 90 }, data: { label: 'B' } },
  { id: 'f3', position: { x: 0, y: 180 }, data: { label: 'A' } },
  { id: 'g3', position: { x: 280, y: 180 }, data: { label: 'B' } },
]
const arrowEdges = [
  { id: 'fwd', source: 'f1', target: 'g1', label: 'forward' },
  { id: 'both', source: 'f2', target: 'g2', markerStart: true, label: 'bidirectional' },
  { id: 'none', source: 'f3', target: 'g3', markerEnd: false, label: 'undirected' },
]

const dagNodes = [
  { id: 'ingest', position: { x: 0, y: 0 }, data: { label: 'Ingest' } },
  { id: 'transform', position: { x: 0, y: 0 }, data: { label: 'Transform' } },
  { id: 'validate', position: { x: 0, y: 0 }, data: { label: 'Validate' } },
  { id: 'load', position: { x: 0, y: 0 }, data: { label: 'Load' } },
]
const dagEdges = [
  { id: 'it', source: 'ingest', target: 'transform' },
  { id: 'iv', source: 'ingest', target: 'validate' },
  { id: 'tl', source: 'transform', target: 'load' },
  { id: 'vl', source: 'validate', target: 'load' },
]

const storyNodes = [
  { id: 'A', position: { x: 0, y: 100 }, data: { label: 'Client' } },
  { id: 'B', position: { x: 240, y: 100 }, data: { label: 'Gateway' } },
  { id: 'C', position: { x: 480, y: 100 }, data: { label: 'Service' } },
]
const storyEdges = [
  { id: 'ab', source: 'A', target: 'B' },
  { id: 'bc', source: 'B', target: 'C' },
]
const story = [
  { from: 'A', to: 'B', label: 'Request sent' },
  { from: 'B', to: 'A', label: 'Acknowledged' },
  { from: 'A', to: 'B', label: 'Payload streamed' },
  { from: 'B', to: 'C', label: 'Forwarded to Service' },
]

export function FlowPage() {
  return (
    <article class="doc-page">
      <header class="doc-head">
        <div class="doc-eyebrow">Flow & diagrams</div>
        <h1>Flow</h1>
        <p class="doc-lede">
          CSS-native, signal-driven node/edge diagrams — flowcharts, DAGs, pipelines, and mind-maps.
          HTML nodes (themed cascivo content for free), SVG edges, and one CSS-transform viewport.
          Pan, zoom, drag, connect, animate. Zero runtime dependencies beyond{' '}
          <code>@cascivo/core</code> and <code>@cascivo/i18n</code>.
        </p>
      </header>

      <section class="doc-section">
        <h2>Declarative &lt;Flow&gt;</h2>
        <p>
          The headline, AI-first surface: a single <code>&lt;Flow nodes edges /&gt;</code> over
          plain serializable data, with an optional background, controls, and animated edges. Drag
          nodes, drag the pane to pan, and scroll to zoom.
        </p>
        <Flow
          style={{ height: 320 }}
          nodes={pipelineNodes}
          edges={pipelineEdges}
          background
          controls
        />
      </section>

      <section class="doc-section">
        <h2>Edge path types</h2>
        <p>
          Owned bezier / straight / smoothstep path math (no D3), with arrowhead markers, labels,
          and a reduced-motion-safe animated variant.
        </p>
        <Flow style={{ height: 280 }} nodes={edgeTypeNodes} edges={edgeTypeEdges} background />
      </section>

      <section class="doc-section">
        <h2>Arrow direction</h2>
        <p>
          Each edge configures its arrowheads with <code>markerStart</code> / <code>markerEnd</code>{' '}
          — forward (default), bidirectional, or an undirected line.
        </p>
        <Flow style={{ height: 280 }} nodes={arrowNodes} edges={arrowEdges} background />
      </section>

      <section class="doc-section">
        <h2>Auto layout + minimap</h2>
        <p>
          A tiny, dependency-free <code>layered</code> layout arranges a DAG, with a draggable
          minimap for navigation. Bring your own positions for full control.
        </p>
        <Flow
          style={{ height: 320 }}
          nodes={dagNodes}
          edges={dagEdges}
          layout="layered"
          background
          minimap
        />
      </section>

      <section class="doc-section">
        <h2>FlowStory — scripted storyline</h2>
        <p>
          Walk a viewer through a graph step by step with fade-in captions. A serializable{' '}
          <code>script</code> of <code>{'{ from, to, label }'}</code> steps animates each step in
          sequence and loops — one <code>A&lt;-&gt;B</code> edge animates both ways, and the arrow
          always points the way the current step flows. A <code>stepGap</code> adds a pause between
          steps so it is easy to follow. Reduced-motion suppresses travel while preserving the
          captions.
        </p>
        <FlowStory
          style={{ height: 360 }}
          nodes={storyNodes}
          edges={storyEdges}
          script={story}
          stepDuration={1600}
          stepGap={1000}
          loop
        />
      </section>
    </article>
  )
}
