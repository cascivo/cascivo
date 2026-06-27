import type { ComponentMeta } from '@cascivo/core'

export const meta: ComponentMeta = {
  name: 'AreaChart',
  description: 'Area chart with optional stacking, multi-series support, and hover tooltip.',
  category: 'chart',
  states: [],
  variants: [],
  sizes: [],
  props: [
    {
      name: 'series',
      type: 'AreaChartSeries<Datum>[]',
      required: true,
      description: 'Array of data series',
    },
    { name: 'x', type: '(d: Datum) => number', required: true, description: 'X-value accessor' },
    { name: 'y', type: '(d: Datum) => number', required: true, description: 'Y-value accessor' },
    { name: 'title', type: 'string', required: true },
    { name: 'description', type: 'string', required: false },
    { name: 'stacked', type: 'boolean', required: false, description: 'Stack series areas' },
    {
      name: 'curve',
      type: "'linear' | 'monotone' | 'step' | 'stepBefore' | 'stepAfter' | 'natural' | 'basis' | 'cardinal' | 'catmullRom'",
      required: false,
      default: 'monotone',
      description: 'Line/area interpolation curve.',
    },
    {
      name: 'fill',
      type: "'solid' | 'gradient' | 'pattern'",
      required: false,
      default: 'solid',
      description: 'Area fill style — solid, a top→bottom gradient, or a pattern.',
    },
    {
      name: 'patternKind',
      type: "'dots' | 'lines' | 'cross'",
      required: false,
      description: 'Pattern motif when fill="pattern".',
    },
    { name: 'width', type: 'number', required: false },
    { name: 'height', type: 'number', required: false, default: '300' },
    { name: 'xTicks', type: 'number', required: false, default: '5' },
    { name: 'yTicks', type: 'number', required: false, default: '5' },
    { name: 'legend', type: 'boolean', required: false },
    {
      name: 'tooltip',
      type: 'boolean',
      required: false,
      description: 'Enable hover/keyboard tooltip',
    },
    { name: 'className', type: 'string', required: false },
    {
      name: 'plain',
      type: 'boolean',
      required: false,
      default: 'false',
      description: 'Marks only — no axes, grid lines, or legend. For micro/inline charts.',
    },
    {
      name: 'annotations',
      type: 'Annotation[]',
      required: false,
      description:
        'Reference lines, shaded bands, and markers drawn over the plot (e.g. a target/threshold line).',
    },
    {
      name: 'labels',
      type: 'boolean | { format?: (v: number) => string; position?: string }',
      required: false,
      description:
        'Print each value as a label on the mark (collision-aware, decorative/aria-hidden).',
    },
    {
      name: 'onSelect',
      type: '(point: ChartPoint) => void',
      required: false,
      description: 'Fired when a point is clicked or activated (Enter/Space) — for drill-down.',
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
      title: 'Basic area chart',
      code: `import { AreaChart } from '@cascivo/charts'

const series = [{ id: 'a', label: 'Revenue', data: [{x:1,y:10},{x:2,y:20}] }]
<AreaChart series={series} x={d => d.x} y={d => d.y} title="Revenue" />`,
    },
  ],
  dependencies: ['@cascivo/charts'],
  tags: ['chart', 'area', 'data-viz'],
  intent: {
    whenToUse: [
      'Showing cumulative volume or magnitude of a trend over continuous time',
      'Emphasising the total of stacked multi-series values across a range',
    ],
    whenNotToUse: [
      'Reading precise individual values — use LineChart',
      'Comparing discrete categories — use BarChart',
    ],
    antiPatterns: [],
    related: [
      {
        name: 'LineChart',
        relationship: 'alternative',
        reason: 'Use when precise values matter more than filled volume',
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
