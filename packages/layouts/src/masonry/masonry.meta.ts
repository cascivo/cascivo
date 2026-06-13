import type { ComponentMeta } from '@cascade-ui/core'

export const meta: ComponentMeta = {
  name: 'Masonry',
  description:
    'Masonry layout — native CSS masonry where supported, multi-column fallback elsewhere (fallback orders items top-to-bottom per column).',
  category: 'layout',
  states: [],
  variants: [],
  sizes: [],
  props: [
    {
      name: 'cols',
      type: 'number',
      required: false,
      default: '3',
      description: 'Number of columns',
    },
    {
      name: 'gap',
      type: '1|2|3|4|5|6|8|10|12',
      required: false,
      default: '4',
      description: 'Spacing token step',
    },
  ],
  tokens: ['--cascivo-space-*'],
  accessibility: { role: 'generic', wcag: '2.1-AA', keyboard: [] },
  examples: [
    {
      title: 'Masonry gallery',
      code: '<Masonry cols={3} gap={4}>{items.map(item => <Card key={item.id}>{item.content}</Card>)}</Masonry>',
      description: 'Variable-height cards laid out in a masonry pattern; falls back to CSS columns',
    },
  ],
  dependencies: ['@cascade-ui/core'],
  tags: ['layout', 'masonry', 'gallery'],
  intent: {
    whenToUse: [
      'Galleries of variable-height items packed into balanced columns',
      'Pinterest-style image or card walls',
    ],
    whenNotToUse: [
      'Items that must align in rows — use Grid',
      'Uniform-height cards — use AutoGrid',
    ],
    antiPatterns: [],
    related: [
      {
        name: 'AutoGrid',
        relationship: 'alternative',
        reason: 'Use when items are uniform height and should align in rows',
      },
      {
        name: 'MediaMasonry',
        relationship: 'alternative',
        reason: 'Use the section-level masonry for full-width media galleries',
      },
    ],
    a11yRationale:
      'Pure layout primitive with no semantic role; does not affect the accessibility tree.',
    flexibility: [],
  },
}
