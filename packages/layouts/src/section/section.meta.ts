import type { ComponentMeta } from '@cascade-ui/core'

export const meta: ComponentMeta = {
  name: 'Section',
  description: 'Page-section shell with block padding, centered inner width, and stack gap.',
  category: 'layout',
  states: [],
  variants: [],
  sizes: [],
  props: [
    {
      name: 'width',
      type: '"content" | "wide" | "full"',
      required: false,
      default: '"content"',
      description: 'Max inline size: content=72rem, wide=90rem, full=none',
    },
    {
      name: 'gap',
      type: '1|2|3|4|5|6|8|10|12',
      required: false,
      default: '8',
      description: 'Stack gap between children (spacing token step)',
    },
  ],
  tokens: ['--cascade-space-*'],
  accessibility: { role: 'region', wcag: 'AA', keyboard: [] },
  examples: [
    {
      title: 'Content section',
      code: '<Section width="content" gap={8}><h2>Heading</h2><p>Body copy.</p></Section>',
      description: 'Centered 72rem content column with 2rem block padding',
    },
  ],
  dependencies: ['@cascade-ui/core'],
  tags: ['layout', 'section', 'page'],
}
