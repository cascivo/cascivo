import type { ComponentMeta } from '@cascivo/core'

export const meta: ComponentMeta = {
  name: 'FlowBackground',
  description: 'Decorative dots / grid / cross canvas background, drawn purely in CSS gradients.',
  category: 'display',
  states: [],
  variants: ['dots', 'grid', 'cross'],
  sizes: [],
  props: [
    {
      name: 'variant',
      type: "'dots' | 'grid' | 'cross'",
      required: false,
      default: 'dots',
      description: 'Pattern style.',
    },
    {
      name: 'gap',
      type: 'number',
      required: false,
      default: '20',
      description: 'Cell spacing (px).',
    },
    {
      name: 'size',
      type: 'number',
      required: false,
      default: '1',
      description: 'Dot radius / line thickness (px).',
    },
    {
      name: 'color',
      type: 'string',
      required: false,
      description: 'Pattern color (defaults to the border token).',
    },
    { name: 'className', type: 'string', required: false },
  ],
  tokens: ['--cascivo-color-border'],
  accessibility: {
    role: 'presentation',
    wcag: '2.1-AA',
    keyboard: [],
  },
  examples: [
    {
      title: 'Dotted background',
      description: 'A dotted grid behind a flow canvas.',
      code: `() => (
  <div style={{ position: 'relative', height: 220, overflow: 'hidden' }}>
    <FlowBackground variant="dots" gap={24} />
  </div>
)`,
    },
    {
      title: 'Grid and cross',
      description: 'The grid and cross variants.',
      code: `() => (
  <div style={{ display: 'grid', gap: 16, gridTemplateColumns: '1fr 1fr' }}>
    <div style={{ position: 'relative', height: 180, overflow: 'hidden' }}>
      <FlowBackground variant="grid" gap={28} />
    </div>
    <div style={{ position: 'relative', height: 180, overflow: 'hidden' }}>
      <FlowBackground variant="cross" gap={28} size={4} />
    </div>
  </div>
)`,
    },
  ],
  dependencies: ['@cascivo/core'],
  tags: ['flow', 'background', 'grid', 'dots', 'canvas'],
  intent: {
    whenToUse: [
      'Giving a flow canvas a sense of space and scale with a dotted or grid backdrop',
      'Reinforcing pan/zoom by letting the pattern move and scale with the viewport',
    ],
    whenNotToUse: [
      'As a page background — this is a flow-canvas decoration, not a general surface',
    ],
    antiPatterns: [
      {
        bad: 'Rendering a DOM node per grid cell',
        good: 'A single CSS gradient layer',
        why: 'Per-cell DOM is needlessly expensive; one repeating gradient costs nothing.',
      },
    ],
    related: [
      { name: 'FlowCanvas', relationship: 'contained-by', reason: 'Lives inside the canvas pane.' },
    ],
    a11yRationale:
      'Purely decorative — marked aria-hidden and presentation, never in the a11y tree.',
    flexibility: [
      {
        area: 'pattern',
        level: 'flexible',
        note: 'dots | grid | cross with configurable gap/size.',
      },
    ],
  },
}
