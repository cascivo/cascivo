import type { ComponentMeta } from '@cascade-ui/core'

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
    { name: 'curve', type: "'linear' | 'monotone'", required: false, default: 'monotone' },
    { name: 'width', type: 'number', required: false },
    { name: 'height', type: 'number', required: false, default: '300' },
    { name: 'xTicks', type: 'number', required: false, default: '5' },
    { name: 'yTicks', type: 'number', required: false, default: '5' },
    { name: 'legend', type: 'boolean', required: false },
    { name: 'className', type: 'string', required: false },
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
      title: 'Basic area chart',
      code: `import { AreaChart } from '@cascade-ui/charts'

const series = [{ id: 'a', label: 'Revenue', data: [{x:1,y:10},{x:2,y:20}] }]
<AreaChart series={series} x={d => d.x} y={d => d.y} title="Revenue" />`,
    },
  ],
  dependencies: ['@cascade-ui/charts'],
  tags: ['chart', 'area', 'data-viz'],
}
