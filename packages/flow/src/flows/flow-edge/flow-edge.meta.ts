import type { ComponentMeta } from '@cascivo/core'

export const meta: ComponentMeta = {
  name: 'FlowEdge',
  description:
    'An SVG edge with bezier/straight/smoothstep paths, an arrowhead, an optional label, and animation.',
  category: 'display',
  states: ['default', 'selected', 'animated'],
  variants: ['bezier', 'straight', 'smoothstep'],
  sizes: [],
  props: [
    {
      name: 'sourceX',
      type: 'number',
      required: true,
      description: 'Source anchor x (flow coords).',
    },
    {
      name: 'sourceY',
      description: 'Y coordinate of the edge’s source point.',
      type: 'number',
      required: true,
    },
    {
      name: 'targetX',
      description: 'X coordinate of the edge’s target point.',
      type: 'number',
      required: true,
    },
    {
      name: 'targetY',
      description: 'Y coordinate of the edge’s target point.',
      type: 'number',
      required: true,
    },
    {
      name: 'type',
      description: "Edge path style ('bezier' | 'straight' | 'smoothstep').",
      type: "'bezier' | 'straight' | 'smoothstep'",
      required: false,
      default: 'bezier',
    },
    {
      name: 'animated',
      description: 'When true, animates the edge path (dashed flow).',
      type: 'boolean',
      required: false,
      default: 'false',
    },
    {
      name: 'label',
      description: 'Text label for the control.',
      type: 'ReactNode',
      required: false,
    },
    {
      name: 'selected',
      description: 'Whether the edge is rendered as selected.',
      type: 'boolean',
      required: false,
      default: 'false',
    },
    {
      name: 'markerStart',
      type: 'boolean',
      required: false,
      default: 'false',
      description:
        'Arrowhead at the source (points back toward the source) — set both for bidirectional.',
    },
    {
      name: 'markerEnd',
      type: 'boolean',
      required: false,
      default: 'true',
      description: 'Arrowhead at the target. Set false for an undirected line.',
    },
    {
      name: 'className',
      description: 'Additional CSS class names merged onto the root element.',
      type: 'string',
      required: false,
    },
  ],
  tokens: ['--cascivo-color-border-strong', '--cascivo-color-accent', '--cascivo-color-surface'],
  accessibility: {
    role: 'presentation',
    wcag: '2.1-AA',
    keyboard: [],
    reducedMotion: true,
  },
  examples: [
    {
      title: 'Edge path types',
      description: 'Bezier, straight, smoothstep, and an animated edge.',
      code: `() => (
  <div style={{ position: 'relative', height: 220 }}>
    <FlowEdge sourceX={20} sourceY={30} targetX={260} targetY={30} type="bezier" label="bezier" />
    <FlowEdge sourceX={20} sourceY={90} targetX={260} targetY={90} type="smoothstep" label="step" />
    <FlowEdge sourceX={20} sourceY={150} targetX={260} targetY={150} animated label="animated" />
  </div>
)`,
    },
    {
      title: 'Arrow direction',
      description:
        'Forward (default), backward, bidirectional, or undirected — via markerStart/markerEnd.',
      code: `() => (
  <div style={{ position: 'relative', height: 260 }}>
    <FlowEdge sourceX={20} sourceY={30} targetX={260} targetY={30} label="forward" />
    <FlowEdge sourceX={20} sourceY={90} targetX={260} targetY={90} markerEnd={false} markerStart label="backward" />
    <FlowEdge sourceX={20} sourceY={150} targetX={260} targetY={150} markerStart label="both" />
    <FlowEdge sourceX={20} sourceY={210} targetX={260} targetY={210} markerEnd={false} label="undirected" />
  </div>
)`,
    },
  ],
  dependencies: ['@cascivo/core'],
  tags: ['flow', 'edge', 'connector', 'animated', 'svg'],
  intent: {
    whenToUse: [
      'Connecting two nodes with a directed path and arrowhead',
      'Animating flow direction along a connection ("marching ants")',
    ],
    whenNotToUse: [
      'For undirected relationships where an arrowhead would mislead — set markerEnd={false}',
    ],
    antiPatterns: [
      {
        bad: 'A requestAnimationFrame loop to animate the dash',
        good: 'A CSS stroke-dashoffset keyframe',
        why: 'The compositor animates CSS for free; a JS loop re-renders every frame.',
      },
    ],
    related: [
      { name: 'FlowNode', relationship: 'pairs-with', reason: 'Edges connect nodes.' },
      {
        name: 'FlowStory',
        relationship: 'pairs-with',
        reason: 'Storylines animate edges in sequence.',
      },
    ],
    a11yRationale:
      'Decorative SVG (aria-hidden); animation is disabled under prefers-reduced-motion.',
    flexibility: [
      { area: 'path', level: 'flexible', note: 'bezier | straight | smoothstep.' },
      { area: 'animation', level: 'flexible', note: 'Optional, reduced-motion-safe.' },
    ],
  },
}
