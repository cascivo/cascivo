import type { ComponentMeta } from '@cascade-ui/core'

export const meta: ComponentMeta = {
  name: 'Treemap',
  description: 'Squarified treemap for visualizing part-to-whole hierarchical data.',
  category: 'chart',
  states: [],
  variants: [],
  sizes: [],
  props: [
    {
      name: 'data',
      type: '{ id: string; label: string; value: number }[]',
      required: true,
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
      title: 'Basic treemap',
      code: `import { Treemap } from '@cascade-ui/charts'

const data = [
  {id:'a',label:'Alpha',value:40},
  {id:'b',label:'Beta',value:25},
  {id:'c',label:'Gamma',value:20},
  {id:'d',label:'Delta',value:15},
]
<Treemap data={data} title="Market share" />`,
    },
  ],
  dependencies: ['@cascade-ui/charts'],
  tags: ['chart', 'treemap', 'hierarchy', 'part-to-whole', 'data-viz'],
}
