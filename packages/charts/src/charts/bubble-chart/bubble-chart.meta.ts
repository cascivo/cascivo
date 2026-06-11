import type { ComponentMeta } from '@cascade-ui/core'

export const meta: ComponentMeta = {
  name: 'BubbleChart',
  description:
    'Bubble chart mapping x, y, and size dimensions; radius is area-proportional via sqrt scale.',
  category: 'chart',
  states: [],
  variants: [],
  sizes: [],
  props: [
    {
      name: 'series',
      type: '{ name: string; data: { x: number; y: number; size: number }[] }[]',
      required: true,
    },
    { name: 'title', type: 'string', required: true },
    { name: 'description', type: 'string', required: false },
    { name: 'width', type: 'number', required: false },
    { name: 'height', type: 'number', required: false, default: '320' },
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
      title: 'Basic bubble chart',
      code: `import { BubbleChart } from '@cascade-ui/charts'

const series = [{ name: 'Group A', data: [{x:1,y:2,size:10},{x:3,y:4,size:30}] }]
<BubbleChart series={series} title="Bubble" />`,
    },
  ],
  dependencies: ['@cascade-ui/charts'],
  tags: ['chart', 'bubble', 'scatter', 'three-dimensional', 'data-viz'],
}
