import type { ComponentMeta } from '@cascivo/core'

export const meta: ComponentMeta = {
  name: 'Flow',
  description:
    'The declarative, AI-first flow surface — render a node/edge graph from plain serializable data.',
  category: 'display',
  states: [],
  variants: [],
  sizes: [],
  props: [
    {
      name: 'nodes',
      type: 'FlowNode[]',
      required: true,
      description: 'Initial nodes (serializable).',
    },
    {
      name: 'edges',
      type: 'FlowEdge[]',
      required: true,
      description: 'Initial edges (serializable).',
    },
    { name: 'onNodesChange', type: '(nodes: FlowNode[]) => void', required: false },
    { name: 'onEdgesChange', type: '(edges: FlowEdge[]) => void', required: false },
    { name: 'onConnect', type: '(connection: Connection) => void', required: false },
    {
      name: 'nodeTypes',
      type: 'Record<string, NodeRenderer>',
      required: false,
      description: 'Custom node renderers keyed by node.type.',
    },
    { name: 'fitView', type: 'boolean', required: false, default: 'true' },
    {
      name: 'background',
      type: 'boolean | FlowBackgroundProps',
      required: false,
      default: 'false',
    },
    { name: 'controls', type: 'boolean', required: false, default: 'false' },
    { name: 'minimap', type: 'boolean', required: false, default: 'false' },
    {
      name: 'layout',
      type: "'grid' | 'layered' | ((nodes, edges) => FlowNode[])",
      required: false,
      description: 'Optional dependency-free layout.',
    },
    { name: 'className', type: 'string', required: false },
  ],
  tokens: ['--cascivo-color-bg', '--cascivo-color-surface', '--cascivo-color-accent'],
  accessibility: {
    role: 'application',
    wcag: '2.1-AA',
    keyboard: ['Tab (focus nodes)', 'Enter/Space (select)', 'Drag (pan/move)', 'Wheel (zoom)'],
  },
  examples: [
    {
      title: 'Declarative pipeline',
      description:
        'A flow from plain serializable data, with background, controls, and an animated edge.',
      code: `() => (
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
)`,
    },
    {
      title: 'Layered layout',
      description: 'Let the dependency-free layered layout arrange a small DAG.',
      code: `() => (
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
)`,
    },
  ],
  dependencies: ['@cascivo/core'],
  tags: ['flow', 'graph', 'declarative', 'diagram', 'ai-first'],
  intent: {
    whenToUse: [
      'Rendering a graph from data — the common case and the agent-emittable surface',
      'Flowcharts, DAGs, pipelines, and mind-maps from plain nodes/edges arrays',
    ],
    whenNotToUse: [
      'A scripted, sequenced walkthrough — use FlowStory',
      'Heavy graph editing (undo/redo, resize/rotate) — out of scope',
    ],
    antiPatterns: [
      {
        bad: 'Imperatively building the graph with graph.addNode(...)',
        good: '<Flow nodes={…} edges={…} />',
        why: 'Declarative serializable data is what an agent can emit and what stays in sync with props.',
      },
    ],
    related: [
      {
        name: 'FlowStory',
        relationship: 'alternative',
        reason: 'Scripted, captioned storyline animation.',
      },
      { name: 'FlowNode', relationship: 'contains', reason: 'Renders a node per entry.' },
      { name: 'FlowEdge', relationship: 'contains', reason: 'Renders an edge per entry.' },
    ],
    a11yRationale:
      'role="application" canvas; nodes are focusable groups; controls are real i18n-labeled buttons.',
    flexibility: [
      { area: 'rendering', level: 'flexible', note: 'Custom node renderers via nodeTypes.' },
      { area: 'layout', level: 'flexible', note: 'grid | layered | bring-your-own positions.' },
      { area: 'chrome', level: 'flexible', note: 'Optional background / controls / minimap.' },
    ],
  },
}
