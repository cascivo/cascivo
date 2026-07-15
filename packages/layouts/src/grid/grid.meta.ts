import type { ComponentMeta } from '@cascivo/core'

export const meta: ComponentMeta = {
  name: 'Grid',
  description: 'CSS grid layout primitive with responsive column collapsing.',
  category: 'layout',
  states: [],
  variants: [],
  sizes: [],
  props: [
    {
      name: 'cols',
      type: 'number | { base?: number; sm?: number; md?: number; lg?: number; xl?: number }',
      required: false,
      description:
        'Column count — a number, or a per-breakpoint object (base/sm/md/lg/xl) for responsive columns',
    },
    {
      name: 'gap',
      type: '1|2|3|4|5|6|8|10|12',
      required: false,
      description: 'Spacing token step',
    },
    {
      name: 'span',
      type: 'number | { base?: number; sm?: number; md?: number; lg?: number; xl?: number }',
      required: false,
      description: 'GridItem: column span — a number, or a per-breakpoint object',
    },
  ],
  tokens: ['--cascivo-space-*'],
  accessibility: { role: 'generic', wcag: '2.1-AA', keyboard: [] },
  examples: [
    {
      title: 'Basic grid',
      code: '<Grid cols={3} gap={4}><GridItem span={1}>A</GridItem><GridItem span={2}>B</GridItem></Grid>',
      description: '3-column grid with spanning item',
    },
    {
      title: 'Responsive dashboard grid',
      code: '<Grid cols={{ base: 1, md: 2, lg: 3 }} gap={4}><GridItem span={{ base: 1, lg: 2 }}>Wide</GridItem></Grid>',
      description:
        '1 column on mobile, 2 on tablet, 3 on desktop; the first item spans 2 on desktop',
    },
  ],
  dependencies: ['@cascivo/core'],
  tags: ['layout', 'grid', 'columns'],
  intent: {
    whenToUse: [
      'Two-dimensional layouts with an explicit column count',
      'Arranging cards or tiles that should align in rows and columns',
    ],
    whenNotToUse: [
      'Single-direction stacking — use Stack',
      'Columns that auto-fit to available width — use AutoGrid',
    ],
    antiPatterns: [],
    related: [
      {
        name: 'AutoGrid',
        relationship: 'alternative',
        reason: 'Use when columns should auto-fill without fixed counts',
      },
      {
        name: 'Columns',
        relationship: 'alternative',
        reason: 'Use for equal-width text columns that collapse on narrow viewports',
      },
    ],
    a11yRationale:
      'Pure layout primitive with no semantic role; does not affect the accessibility tree.',
    flexibility: [],
  },
}
