import type { ComponentMeta } from '@cascade-ui/core'

export const meta: ComponentMeta = {
  name: 'ScatterChart',
  description: 'Scatter plot with variable point radius, multi-series, and hover tooltip.',
  category: 'chart',
  states: [],
  variants: [],
  sizes: [],
  props: [
    { name: 'series', type: 'ScatterChartSeries[]', required: true },
    { name: 'title', type: 'string', required: true },
    { name: 'description', type: 'string', required: false },
    {
      name: 'r',
      type: 'number | ((d: ScatterDatum) => number)',
      required: false,
      default: '4',
      description: 'Point radius or accessor',
    },
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
      title: 'Basic scatter chart',
      code: `import { ScatterChart } from '@cascade-ui/charts'

const series = [{ id: 'a', label: 'Group A', data: [{x:1,y:2},{x:3,y:4}] }]
<ScatterChart series={series} title="Scatter" />`,
    },
  ],
  dependencies: ['@cascade-ui/charts'],
  tags: ['chart', 'scatter', 'plot', 'data-viz'],
}
