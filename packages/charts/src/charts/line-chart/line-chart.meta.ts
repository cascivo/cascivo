import type { ComponentMeta } from '@cascade-ui/core'

export const meta: ComponentMeta = {
  name: 'LineChart',
  description:
    'Time-series or numeric line chart with multi-series support, hover tooltip, and legend.',
  category: 'chart',
  states: [],
  variants: [],
  sizes: [],
  props: [
    {
      name: 'series',
      type: 'LineChartSeries<Datum>[]',
      required: true,
      description: 'Array of data series',
    },
    {
      name: 'x',
      type: '(d: Datum) => number | Date',
      required: true,
      description: 'X-value accessor',
    },
    { name: 'y', type: '(d: Datum) => number', required: true, description: 'Y-value accessor' },
    {
      name: 'title',
      type: 'string',
      required: true,
      description: 'Chart title (also used as aria-label)',
    },
    {
      name: 'description',
      type: 'string',
      required: false,
      description: 'Subtitle shown below title',
    },
    {
      name: 'curve',
      type: "'linear' | 'monotone'",
      required: false,
      default: 'monotone',
      description: 'Line interpolation curve',
    },
    {
      name: 'width',
      type: 'number',
      required: false,
      description: 'Fixed SVG width (defaults to container width)',
    },
    {
      name: 'height',
      type: 'number',
      required: false,
      default: '300',
      description: 'SVG height in px',
    },
    {
      name: 'xTicks',
      type: 'number',
      required: false,
      default: '5',
      description: 'Approximate number of X-axis ticks',
    },
    {
      name: 'yTicks',
      type: 'number',
      required: false,
      default: '5',
      description: 'Approximate number of Y-axis ticks',
    },
    { name: 'legend', type: 'boolean', required: false, description: 'Show series legend' },
    { name: 'tooltip', type: 'boolean', required: false, description: 'Enable hover tooltip' },
    {
      name: 'formatTooltip',
      type: '(datum: Datum, series: LineChartSeries<Datum>) => string',
      required: false,
      description: 'Custom tooltip formatter',
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
    '--cascade-chart-1',
    '--cascade-chart-2',
    '--cascade-chart-3',
    '--cascade-chart-4',
    '--cascade-chart-5',
    '--cascade-chart-6',
    '--cascade-chart-7',
    '--cascade-chart-8',
  ],
  accessibility: {
    role: 'img',
    wcag: '2.1-AA',
    keyboard: [
      'Tab (focus chart)',
      'ArrowLeft/ArrowRight (navigate points)',
      'Home/End (first/last point)',
      'Escape (clear focus)',
    ],
  },
  examples: [
    {
      title: 'Basic line chart',
      code: `import { LineChart } from '@cascade-ui/charts'

const series = [{ id: 'a', label: 'Revenue', data: [{x:1,y:10},{x:2,y:20},{x:3,y:15}] }]
<LineChart series={series} x={d => d.x} y={d => d.y} title="Revenue" />`,
    },
  ],
  dependencies: ['@cascade-ui/charts'],
  tags: ['chart', 'line', 'time-series', 'data-viz'],
  intent: {
    whenToUse: [
      'Showing trends and precise values over continuous time or a numeric range',
      'Comparing the trajectory of multiple series on a shared scale',
    ],
    whenNotToUse: [
      'Comparing discrete categories — use BarChart',
      'Emphasising cumulative volume — use AreaChart',
    ],
    antiPatterns: [],
    related: [
      {
        name: 'AreaChart',
        relationship: 'alternative',
        reason: 'Use when filled cumulative volume matters more than precise values',
      },
      {
        name: 'BarChart',
        relationship: 'alternative',
        reason: 'Use for discrete categorical comparison',
      },
    ],
    a11yRationale: 'Renders with role="img" and requires a title prop for screen reader labeling.',
    flexibility: [],
  },
}
