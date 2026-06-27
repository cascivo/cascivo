import type { ComponentMeta } from '@cascivo/core'

export const meta: ComponentMeta = {
  name: 'Stream',
  description: 'Streamgraph — stacked areas on a centered (silhouette) flowing baseline.',
  category: 'chart',
  states: [],
  variants: [],
  sizes: [],
  props: [
    {
      name: 'series',
      type: 'StreamSeries[]',
      required: true,
      description: 'Series, each with values[] aligned to categories.',
    },
    {
      name: 'categories',
      type: '(string | number)[]',
      required: true,
      description: 'X-axis labels aligned with each series values.',
    },
    { name: 'title', type: 'string', required: true },
    { name: 'description', type: 'string', required: false },
    {
      name: 'offset',
      type: "'silhouette' | 'zero'",
      required: false,
      default: 'silhouette',
      description: 'silhouette centers the stack (streamgraph); zero is a baseline stack.',
    },
    {
      name: 'curve',
      type: 'Curve',
      required: false,
      default: 'basis',
      description: 'Interpolation curve.',
    },
    { name: 'width', type: 'number', required: false },
    { name: 'height', type: 'number', required: false, default: '300' },
    { name: 'legend', type: 'boolean', required: false },
    { name: 'tooltip', type: 'boolean', required: false },
    { name: 'className', type: 'string', required: false },
    { name: 'plain', type: 'boolean', required: false, default: 'false' },
  ],
  tokens: [
    '--cascivo-chart-1',
    '--cascivo-chart-2',
    '--cascivo-chart-3',
    '--cascivo-chart-4',
    '--cascivo-chart-5',
    '--cascivo-chart-6',
    '--cascivo-chart-7',
    '--cascivo-chart-8',
  ],
  accessibility: {
    role: 'img',
    wcag: '2.1-AA',
    keyboard: ['Tab (focus chart)', 'ArrowLeft/ArrowRight (navigate)', 'Escape (clear focus)'],
  },
  examples: [
    {
      title: 'Streamgraph',
      code: `import { Stream } from '@cascivo/charts'

<Stream
  title="Topics over time"
  categories={['Jan','Feb','Mar','Apr']}
  series={[
    { id: 'a', label: 'A', values: [4, 6, 5, 8] },
    { id: 'b', label: 'B', values: [2, 3, 7, 4] },
  ]}
/>`,
    },
  ],
  dependencies: ['@cascivo/charts'],
  tags: ['chart', 'stream', 'streamgraph', 'area', 'data-viz'],
  intent: {
    whenToUse: [
      'Showing how several series ebb and flow over time as proportions of a whole',
      'An organic, aesthetic alternative to a stacked area chart',
    ],
    whenNotToUse: [
      'Reading precise values — use LineChart or AreaChart',
      'Few categories with exact comparison — use BarChart',
    ],
    antiPatterns: [],
    related: [
      {
        name: 'AreaChart',
        relationship: 'alternative',
        reason: 'Use a zero-baseline stacked area for precise reading',
      },
    ],
    a11yRationale: 'Renders role="img" with a title and a fallback data table.',
    flexibility: [],
  },
}
