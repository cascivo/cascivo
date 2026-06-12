import type { ComponentMeta } from '@cascade-ui/core'

export const meta: ComponentMeta = {
  name: 'AutoGrid',
  description: 'Media-query-free responsive grid — columns auto-fill based on available space.',
  category: 'layout',
  states: [],
  variants: [],
  sizes: [],
  props: [
    {
      name: 'min',
      type: 'string',
      required: false,
      default: '"16rem"',
      description: 'Minimum track width before items wrap to fewer columns',
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
      title: 'Auto-filling grid',
      code: '<AutoGrid min="12rem" gap={4}><div>Card 1</div><div>Card 2</div><div>Card 3</div></AutoGrid>',
      description: 'Items fill available space and wrap when narrower than 12rem',
    },
  ],
  dependencies: ['@cascade-ui/core'],
  tags: ['layout', 'grid', 'responsive'],
}
