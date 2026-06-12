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
  tokens: ['--cascade-space-*'],
  accessibility: { role: 'generic', wcag: 'AA', keyboard: [] },
  examples: [
    {
      title: 'Masonry gallery',
      code: '<Masonry cols={3} gap={4}>{items.map(item => <Card key={item.id}>{item.content}</Card>)}</Masonry>',
      description: 'Variable-height cards laid out in a masonry pattern; falls back to CSS columns',
    },
  ],
  dependencies: ['@cascade-ui/core'],
  tags: ['layout', 'masonry', 'gallery'],
}
