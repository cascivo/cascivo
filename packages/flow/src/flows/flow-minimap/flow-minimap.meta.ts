import type { ComponentMeta } from '@cascivo/core'

export const meta: ComponentMeta = {
  name: 'FlowMiniMap',
  description: 'A scaled SVG overview of the graph with a draggable viewport rectangle.',
  category: 'display',
  states: [],
  variants: [],
  sizes: [],
  props: [
    { name: 'nodes', type: 'FlowNode[]', required: true },
    { name: 'viewport', type: 'Viewport', required: true },
    { name: 'containerWidth', type: 'number', required: false },
    { name: 'containerHeight', type: 'number', required: false },
    { name: 'width', type: 'number', required: false, default: '200' },
    { name: 'height', type: 'number', required: false, default: '150' },
    {
      name: 'position',
      type: "'top-left' | 'top-right' | 'bottom-left' | 'bottom-right'",
      required: false,
      default: 'bottom-right',
    },
    { name: 'onViewportChange', type: '(viewport: Viewport) => void', required: false },
    { name: 'className', type: 'string', required: false },
  ],
  tokens: ['--cascivo-color-surface', '--cascivo-color-border-strong', '--cascivo-color-accent'],
  accessibility: {
    role: 'img',
    wcag: '2.1-AA',
    keyboard: [],
  },
  examples: [
    {
      title: 'Graph overview',
      code: `() => (
  <FlowMiniMap
    nodes={[
      { id: 'a', position: { x: 0, y: 0 } },
      { id: 'b', position: { x: 220, y: 120 } },
      { id: 'c', position: { x: 440, y: 0 } },
    ]}
    viewport={{ x: 0, y: 0, zoom: 1 }}
    containerWidth={400}
    containerHeight={300}
  />
)`,
    },
  ],
  dependencies: ['@cascivo/core'],
  tags: ['flow', 'minimap', 'overview', 'chrome'],
  intent: {
    whenToUse: [
      'Orienting users in a large graph',
      'Letting users jump around by dragging the view rect',
    ],
    whenNotToUse: ['Tiny graphs that fit on screen'],
    antiPatterns: [],
    related: [
      {
        name: 'FlowControls',
        relationship: 'pairs-with',
        reason: 'Complementary navigation chrome.',
      },
    ],
    a11yRationale: 'role="img" with an i18n-defaulted label describing the overview.',
    flexibility: [{ area: 'size', level: 'flexible', note: 'Configurable width/height.' }],
  },
}
