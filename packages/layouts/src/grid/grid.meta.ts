import type { ComponentMeta } from '@cascade-ui/core'

export const meta: ComponentMeta = {
  name: 'Grid',
  description: 'CSS grid layout primitive with responsive column collapsing.',
  category: 'layout',
  states: [],
  variants: [],
  sizes: [],
  props: [
    { name: 'cols', type: 'number', required: false, description: 'Number of grid columns' },
    { name: 'gap', type: '1|2|3|4|5|6|8|10|12', required: false, description: 'Spacing token step' },
    { name: 'span', type: 'number', required: false, description: 'GridItem: column span count' },
  ],
  tokens: ['--cascade-space-*'],
  accessibility: { role: 'generic', wcag: 'AA', keyboard: [] },
  examples: [
    {
      title: 'Basic grid',
      code: '<Grid cols={3} gap={4}><GridItem span={1}>A</GridItem><GridItem span={2}>B</GridItem></Grid>',
      description: '3-column grid with spanning item',
    },
  ],
  dependencies: ['@cascade-ui/core'],
  tags: ['layout', 'grid', 'columns'],
}
