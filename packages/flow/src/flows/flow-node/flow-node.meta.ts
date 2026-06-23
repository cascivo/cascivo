import type { ComponentMeta } from '@cascivo/core'

export const meta: ComponentMeta = {
  name: 'FlowNode',
  description:
    'An HTML node box positioned in the viewport pane — draggable, selectable, with arbitrary children.',
  category: 'display',
  states: ['default', 'dragging', 'selected', 'focus'],
  variants: [],
  sizes: [],
  props: [
    { name: 'id', type: 'string', required: true, description: 'Stable node id.' },
    {
      name: 'position',
      type: '{ x: number; y: number }',
      required: false,
      description: 'Position in flow coords (controllable).',
    },
    {
      name: 'onPositionChange',
      type: '(position: XYPosition) => void',
      required: false,
      description: 'Fired while dragging.',
    },
    {
      name: 'zoom',
      type: 'number',
      required: false,
      default: '1',
      description: 'Current zoom (drag deltas are divided by it).',
    },
    { name: 'selected', type: 'boolean', required: false, default: 'false' },
    { name: 'draggable', type: 'boolean', required: false, default: 'true' },
    {
      name: 'interactive',
      type: 'boolean',
      required: false,
      default: 'true',
      description: 'When false, the node is view-only: not draggable, selectable, or focusable.',
    },
    { name: 'onSelect', type: '(id: string) => void', required: false },
    { name: 'children', type: 'ReactNode', required: false, description: 'Any cascivo content.' },
    { name: 'className', type: 'string', required: false },
  ],
  tokens: [
    '--cascivo-color-surface',
    '--cascivo-color-border',
    '--cascivo-color-accent',
    '--cascivo-radius-md',
    '--cascivo-shadow-sm',
  ],
  accessibility: {
    role: 'group',
    wcag: '2.1-AA',
    keyboard: ['Tab (focus)', 'Enter/Space (select)'],
  },
  examples: [
    {
      title: 'A draggable node',
      code: `() => (
  <div style={{ position: 'relative', height: 160 }}>
    <FlowNode id="a" defaultPosition={{ x: 40, y: 50 }}>Service A</FlowNode>
  </div>
)`,
    },
  ],
  dependencies: ['@cascivo/core'],
  tags: ['flow', 'node', 'draggable', 'graph'],
  intent: {
    whenToUse: [
      'Representing a unit in a graph that holds arbitrary themed content',
      'When you hand-compose a flow and need draggable, selectable boxes',
    ],
    whenNotToUse: ['For the common case — the declarative <Flow> renders nodes for you'],
    antiPatterns: [
      {
        bad: 'Rendering node content into an SVG',
        good: 'HTML node boxes',
        why: 'HTML nodes inherit the data-theme scope and can contain any cascivo component.',
      },
    ],
    related: [
      {
        name: 'FlowHandle',
        relationship: 'contains',
        reason: 'Connection ports live inside a node.',
      },
      { name: 'FlowEdge', relationship: 'pairs-with', reason: 'Edges route between nodes.' },
    ],
    a11yRationale:
      'Focusable group; Enter/Space select. Visual states (hover/focus/selected) are CSS.',
    flexibility: [
      { area: 'content', level: 'flexible', note: 'Renders any children.' },
      { area: 'position', level: 'flexible', note: 'Controllable; draggable toggleable.' },
    ],
  },
}
