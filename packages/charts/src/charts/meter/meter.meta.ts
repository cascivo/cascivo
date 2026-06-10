import type { ComponentMeta } from '@cascade-ui/core'

export const meta: ComponentMeta = {
  name: 'Meter',
  description: 'Progress meter in bar or gauge variant with threshold coloring.',
  category: 'chart',
  states: [],
  variants: ['bar', 'gauge'],
  sizes: [],
  props: [
    { name: 'value', type: 'number', required: true, description: 'Current value' },
    { name: 'label', type: 'string', required: true },
    { name: 'min', type: 'number', required: false, default: '0' },
    { name: 'max', type: 'number', required: false, default: '100' },
    { name: 'variant', type: "'bar' | 'gauge'", required: false, default: 'bar' },
    {
      name: 'thresholds',
      type: 'MeterThresholds',
      required: false,
      description: 'Color breakpoints',
    },
    { name: 'width', type: 'number', required: false },
    { name: 'height', type: 'number', required: false },
  ],
  tokens: ['--cascade-chart-1'],
  accessibility: { role: 'meter', wcag: 'AA', keyboard: [] },
  examples: [
    {
      title: 'Basic meter',
      code: `import { Meter } from '@cascade-ui/charts'

<Meter value={72} label="CPU usage" />`,
    },
  ],
  dependencies: ['@cascade-ui/charts'],
  tags: ['chart', 'meter', 'gauge', 'progress', 'data-viz'],
}
