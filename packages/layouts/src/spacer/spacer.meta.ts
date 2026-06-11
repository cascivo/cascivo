import type { ComponentMeta } from '@cascade-ui/core'

export const meta: ComponentMeta = {
  name: 'Spacer',
  description: 'Fixed-height spacing block using design token steps.',
  category: 'layout',
  states: [],
  variants: [],
  sizes: [],
  props: [
    {
      name: 'size',
      type: '1|2|3|4|5|6|8|10|12',
      required: false,
      description: 'Spacing token step',
    },
  ],
  tokens: ['--cascade-space-*'],
  accessibility: { role: 'none', wcag: 'AA', keyboard: [] },
  examples: [
    {
      title: 'Spacer',
      code: '<Spacer size={8} />',
      description: 'Adds vertical space between elements',
    },
  ],
  dependencies: ['@cascade-ui/core'],
  tags: ['layout', 'spacer', 'spacing'],
}
