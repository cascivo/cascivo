import type { ComponentMeta } from '@cascivo/core'

export const meta: ComponentMeta = {
  name: 'FlowPanel',
  description: 'An absolutely-positioned slot for custom flow-canvas UI (legend, toolbar).',
  category: 'display',
  states: [],
  variants: [],
  sizes: [],
  props: [
    {
      name: 'position',
      description: 'Position of the component.',
      type: "'top-left' | 'top-center' | 'top-right' | 'bottom-left' | 'bottom-center' | 'bottom-right'",
      required: false,
      default: 'top-right',
    },
    {
      name: 'children',
      description: 'Content rendered inside the component.',
      type: 'ReactNode',
      required: false,
    },
    {
      name: 'className',
      description: 'Additional CSS class names merged onto the root element.',
      type: 'string',
      required: false,
    },
  ],
  tokens: ['--cascivo-space-3'],
  accessibility: {
    role: 'group',
    wcag: '2.1-AA',
    keyboard: [],
  },
  examples: [
    {
      title: 'A legend panel',
      code: `() => (
  <div style={{ position: 'relative', height: 160, border: '1px solid var(--cascivo-color-border)' }}>
    <FlowPanel position="top-right">Legend</FlowPanel>
  </div>
)`,
    },
  ],
  dependencies: ['@cascivo/core'],
  tags: ['flow', 'panel', 'slot', 'chrome'],
  intent: {
    whenToUse: ['Overlaying custom UI (a legend, a toolbar) on a flow canvas'],
    whenNotToUse: ['For zoom/fit controls — use FlowControls'],
    antiPatterns: [],
    related: [
      {
        name: 'FlowControls',
        relationship: 'alternative',
        reason: 'Purpose-built zoom/fit chrome.',
      },
    ],
    a11yRationale: 'A plain positioned container; semantics come from its children.',
    flexibility: [{ area: 'position', level: 'flexible', note: 'Six anchor positions.' }],
  },
}
