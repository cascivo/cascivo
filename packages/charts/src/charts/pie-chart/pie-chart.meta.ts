import type { ComponentMeta } from '@cascade-ui/core'

export const meta: ComponentMeta = {
  name: 'PieChart',
  description: 'Pie or donut chart with hover segments and optional legend.',
  category: 'chart',
  states: [],
  variants: ['pie', 'donut'],
  sizes: [],
  props: [
    {
      name: 'data',
      type: 'PieChartDatum[]',
      required: true,
      description: 'Array of { label, value } datums',
    },
    { name: 'title', type: 'string', required: true },
    { name: 'description', type: 'string', required: false },
    { name: 'donut', type: 'boolean', required: false, description: 'Render as donut chart' },
    { name: 'width', type: 'number', required: false },
    { name: 'height', type: 'number', required: false, default: '300' },
    { name: 'legend', type: 'boolean', required: false },
    { name: 'className', type: 'string', required: false },
    {
      name: 'plain',
      type: 'boolean',
      required: false,
      default: 'false',
      description: 'Marks only — no axes, grid lines, or legend. For micro/inline charts.',
    },
  ],
  tokens: [
    '--cascade-chart-1',
    '--cascade-chart-2',
    '--cascade-chart-3',
    '--cascade-chart-4',
    '--cascade-chart-5',
    '--cascade-chart-6',
    '--cascade-chart-7',
    '--cascade-chart-8',
  ],
  accessibility: { role: 'img', wcag: 'AA', keyboard: [] },
  examples: [
    {
      title: 'Basic pie chart',
      code: `import { PieChart } from '@cascade-ui/charts'

<PieChart data={[{label:'A',value:60},{label:'B',value:40}]} title="Market share" />`,
    },
  ],
  dependencies: ['@cascade-ui/charts'],
  tags: ['chart', 'pie', 'donut', 'data-viz'],
  intent: {
    whenToUse: [
      'Showing part-of-whole proportions with five or fewer slices',
      'A single composition at one point in time',
    ],
    whenNotToUse: [
      'Comparing precise values or many categories — use BarChart',
      'Showing change over time — use LineChart or AreaChart',
    ],
    antiPatterns: [],
    related: [
      {
        name: 'BarChart',
        relationship: 'alternative',
        reason: 'Use when comparing more than five categories or precise values',
      },
      {
        name: 'Treemap',
        relationship: 'alternative',
        reason: 'Use for part-to-whole with many or hierarchical segments',
      },
    ],
    a11yRationale: 'Renders with role="img" and requires a title prop for screen reader labeling.',
    flexibility: [],
  },
}
