import type { ComponentMeta } from '@cascade-ui/core'

export const meta: ComponentMeta = {
  name: 'Center',
  description: 'Horizontally centered container with a configurable max-width.',
  category: 'layout',
  states: [],
  variants: [],
  sizes: [],
  props: [
    { name: 'maxWidth', type: 'string', required: false, description: 'CSS max-width value' },
  ],
  tokens: ['--cascade-space-4'],
  accessibility: { role: 'generic', wcag: 'AA', keyboard: [] },
  examples: [
    {
      title: 'Centered content',
      code: '<Center maxWidth="60rem"><p>Content</p></Center>',
      description: 'Centered container with custom max-width',
    },
  ],
  dependencies: ['@cascade-ui/core'],
  tags: ['layout', 'center', 'wrapper'],
  intent: {
    whenToUse: [
      'Horizontally centering content within a configurable max-width',
      'Constraining page or section content to a readable measure',
    ],
    whenNotToUse: [
      'Stacking children with consistent gaps — use Stack',
      'Multi-column or grid arrangements — use Columns or Grid',
    ],
    antiPatterns: [],
    related: [
      {
        name: 'Section',
        relationship: 'contained-by',
        reason: 'Sections use a centered inner width built on the same idea',
      },
      {
        name: 'Stack',
        relationship: 'pairs-with',
        reason: 'Stack the centered content vertically inside it',
      },
    ],
    a11yRationale:
      'Pure layout wrapper with no semantic role; does not affect the accessibility tree.',
    flexibility: [],
  },
}
