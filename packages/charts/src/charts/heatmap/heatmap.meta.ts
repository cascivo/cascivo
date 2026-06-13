import type { ComponentMeta } from '@cascade-ui/core'

export const meta: ComponentMeta = {
  name: 'Heatmap',
  description: 'Two-dimensional heatmap with band scales and color-mix cell interpolation.',
  category: 'chart',
  states: [],
  variants: [],
  sizes: [],
  props: [
    {
      name: 'data',
      type: '{ x: string; y: string; value: number }[]',
      required: true,
      description: 'Array of x/y/value triples',
    },
    { name: 'title', type: 'string', required: true },
    { name: 'description', type: 'string', required: false },
    { name: 'width', type: 'number', required: false },
    { name: 'height', type: 'number', required: false, default: '320' },
    { name: 'className', type: 'string', required: false },
    {
      name: 'plain',
      type: 'boolean',
      required: false,
      default: 'false',
      description: 'Marks only — no axes, grid lines, or legend. For micro/inline charts.',
    },
  ],
  tokens: ['--cascade-chart-1', '--cascade-color-neutral-100'],
  accessibility: { role: 'img', wcag: 'AA', keyboard: [] },
  examples: [
    {
      title: 'Basic heatmap',
      code: `import { Heatmap } from '@cascade-ui/charts'

const data = [
  {x:'Mon',y:'AM',value:10},{x:'Mon',y:'PM',value:20},
  {x:'Tue',y:'AM',value:15},{x:'Tue',y:'PM',value:5},
]
<Heatmap data={data} title="Activity" />`,
    },
  ],
  dependencies: ['@cascade-ui/charts'],
  tags: ['chart', 'heatmap', 'matrix', 'data-viz'],
  intent: {
    whenToUse: [
      'Showing magnitude across two categorical dimensions as a color-coded matrix',
      'Spotting patterns, clusters, or hotspots in dense grid data',
    ],
    whenNotToUse: [
      'Reading precise values — color encoding is approximate',
      'A single-dimension comparison — use BarChart',
    ],
    antiPatterns: [],
    related: [
      {
        name: 'Treemap',
        relationship: 'alternative',
        reason: 'Use for part-to-whole hierarchical magnitude rather than a grid',
      },
    ],
    a11yRationale: 'Renders with role="img" and requires a title prop for screen reader labeling.',
    flexibility: [],
  },
}
