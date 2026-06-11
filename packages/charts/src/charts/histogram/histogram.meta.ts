import type { ComponentMeta } from '@cascade-ui/core'

export const meta: ComponentMeta = {
  name: 'Histogram',
  description: 'Frequency histogram using Freedman–Diaconis binning with hover tooltips.',
  category: 'chart',
  states: [],
  variants: [],
  sizes: [],
  props: [
    {
      name: 'data',
      type: 'number[]',
      required: true,
      description: 'Array of numeric values to bin',
    },
    {
      name: 'bins',
      type: 'number',
      required: false,
      description: 'Explicit bin count (defaults to Freedman–Diaconis)',
    },
    { name: 'title', type: 'string', required: true },
    { name: 'label', type: 'string', required: true, description: 'X-axis label' },
    { name: 'description', type: 'string', required: false },
    { name: 'width', type: 'number', required: false },
    { name: 'height', type: 'number', required: false, default: '300' },
    { name: 'className', type: 'string', required: false },
  ],
  tokens: ['--cascade-chart-1'],
  accessibility: { role: 'img', wcag: 'AA', keyboard: [] },
  examples: [
    {
      title: 'Basic histogram',
      code: `import { Histogram } from '@cascade-ui/charts'

const data = Array.from({length:100}, () => Math.random() * 100)
<Histogram data={data} title="Distribution" label="Value" />`,
    },
  ],
  dependencies: ['@cascade-ui/charts'],
  tags: ['chart', 'histogram', 'distribution', 'frequency', 'data-viz'],
}
