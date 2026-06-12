import type { ComponentMeta } from '@cascade-ui/core'

export const meta: ComponentMeta = {
  name: 'ComboChart',
  description: 'Combination bar + line chart on shared or dual y-axes.',
  category: 'chart',
  states: [],
  variants: [],
  sizes: [],
  props: [
    {
      name: 'bars',
      type: '{ label: string; value: number }[]',
      required: true,
      description: 'Bar series data',
    },
    {
      name: 'line',
      type: '{ x: number; y: number }[]',
      required: true,
      description: 'Line series data points',
    },
    { name: 'title', type: 'string', required: true },
    { name: 'description', type: 'string', required: false },
    {
      name: 'secondAxis',
      type: 'boolean',
      required: false,
      description: 'Render line on a secondary right y-axis',
    },
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
  tokens: ['--cascade-chart-1', '--cascade-chart-2'],
  accessibility: { role: 'img', wcag: 'AA', keyboard: [] },
  examples: [
    {
      title: 'Basic combo chart',
      code: `import { ComboChart } from '@cascade-ui/charts'

const bars = [{label:'Jan',value:100},{label:'Feb',value:120},{label:'Mar',value:90}]
const line = [{x:0,y:50},{x:1,y:70},{x:2,y:60}]
<ComboChart bars={bars} line={line} title="Sales vs Target" />`,
    },
  ],
  dependencies: ['@cascade-ui/charts'],
  tags: ['chart', 'combo', 'bar', 'line', 'dual-axis', 'data-viz'],
}
