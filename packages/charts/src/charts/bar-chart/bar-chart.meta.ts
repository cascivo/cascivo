import type { ComponentMeta } from '@cascivo/core'

export const meta: ComponentMeta = {
  name: 'BarChart',
  description:
    'Bar chart with vertical/horizontal orientation, grouped or stacked modes, and multi-series support.',
  category: 'chart',
  states: [],
  variants: ['grouped', 'stacked'],
  sizes: [],
  props: [
    {
      name: 'series',
      type: 'BarChartSeries<Datum>[]',
      required: true,
      description:
        'Series array. Each series accepts an optional `color` (any CSS color) overriding the positional palette for that series/stacked layer.',
    },
    { name: 'x', type: '(d: Datum) => string', required: true },
    { name: 'y', type: '(d: Datum) => number', required: true },
    { name: 'title', type: 'string', required: true },
    { name: 'description', type: 'string', required: false },
    {
      name: 'orientation',
      type: "'vertical' | 'horizontal'",
      required: false,
      default: 'vertical',
    },
    { name: 'mode', type: "'grouped' | 'stacked'", required: false, default: 'grouped' },
    { name: 'width', type: 'number', required: false },
    { name: 'height', type: 'number', required: false, default: '300' },
    { name: 'xTicks', type: 'number', required: false },
    { name: 'yTicks', type: 'number', required: false, default: '5' },
    {
      name: 'xLabelEvery',
      type: 'number',
      required: false,
      description: 'Show every Nth category label (always the last) to thin a crowded x-axis.',
    },
    { name: 'legend', type: 'boolean', required: false },
    { name: 'tooltip', type: 'boolean', required: false },
    {
      name: 'tooltipFormat',
      type: '(p: ChartPoint) => string',
      required: false,
      description:
        'Custom tooltip formatter. The stacked default lists "label · total" + each non-zero layer in its color.',
    },
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
    '--cascivo-chart-1',
    '--cascivo-chart-2',
    '--cascivo-chart-3',
    '--cascivo-chart-4',
    '--cascivo-chart-5',
    '--cascivo-chart-6',
    '--cascivo-chart-7',
    '--cascivo-chart-8',
  ],
  accessibility: { role: 'img', wcag: '2.1-AA', keyboard: [] },
  examples: [
    {
      title: 'Basic bar chart',
      code: `import { BarChart } from '@cascivo/charts'

const series = [{ id: 'a', label: 'Sales', data: [{x:'Jan',y:100},{x:'Feb',y:150}] }]
<BarChart series={series} x={d => d.x} y={d => d.y} title="Sales" />`,
    },
    {
      title: 'Stacked bar from row-oriented data',
      code: `import { BarChart, toStackedSeries } from '@cascivo/charts'

// Pivot { label, segments[] } rows into series + x/y. Per-segment color is preserved.
const rows = [
  { label: 'Mon', segments: [
    { key: 'Done', value: 5, color: 'var(--cascivo-color-success)' },
    { key: 'Blocked', value: 2, color: 'var(--cascivo-color-destructive)' },
  ] },
  { label: 'Tue', segments: [
    { key: 'Done', value: 8, color: 'var(--cascivo-color-success)' },
    { key: 'Blocked', value: 1, color: 'var(--cascivo-color-destructive)' },
  ] },
]
// Tooltip shows "Mon · 7" then each non-zero layer in its color.
<BarChart mode="stacked" tooltip {...toStackedSeries(rows)} title="Throughput" />`,
    },
  ],
  dependencies: ['@cascivo/charts'],
  tags: ['chart', 'bar', 'data-viz'],
  intent: {
    whenToUse: [
      'Comparing discrete categorical values across groups',
      'Showing grouped or stacked multi-series data per category',
    ],
    whenNotToUse: [
      'Showing trends over continuous time — use LineChart',
      'Part-of-whole proportions — use PieChart for ≤5 categories',
    ],
    antiPatterns: [],
    related: [
      {
        name: 'LineChart',
        relationship: 'alternative',
        reason: 'Use for trends over continuous time',
      },
      {
        name: 'Histogram',
        relationship: 'alternative',
        reason: 'Use to show the distribution of a continuous variable',
      },
    ],
    a11yRationale: 'Renders with role="img" and requires a title prop for screen reader labeling.',
    flexibility: [],
  },
}
