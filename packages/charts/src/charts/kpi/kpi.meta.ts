import type { ComponentMeta } from '@cascade-ui/core'

export const meta: ComponentMeta = {
  name: 'Kpi',
  description:
    'KPI card showing a primary metric with optional delta indicator, icon, and sparkline.',
  category: 'chart',
  states: [],
  variants: [],
  sizes: [],
  props: [
    { name: 'value', type: 'string | number', required: true, description: 'Primary metric value' },
    { name: 'label', type: 'string', required: true, description: 'Metric label' },
    {
      name: 'delta',
      type: 'number',
      required: false,
      description: 'Change value (positive = up, negative = down)',
    },
    {
      name: 'deltaLabel',
      type: 'string',
      required: false,
      description: 'Delta context label (e.g. "vs last week")',
    },
    { name: 'icon', type: 'ReactNode', required: false },
    {
      name: 'sparkline',
      type: 'number[]',
      required: false,
      description: 'Trend data for embedded sparkline',
    },
    { name: 'className', type: 'string', required: false },
  ],
  tokens: ['--cascade-chart-1'],
  accessibility: { role: 'figure', wcag: 'AA', keyboard: [] },
  examples: [
    {
      title: 'Basic KPI card',
      code: `import { Kpi } from '@cascade-ui/charts'

<Kpi value="$12,400" label="Monthly revenue" delta={8.2} deltaLabel="vs last month" />`,
    },
  ],
  dependencies: ['@cascade-ui/charts'],
  tags: ['chart', 'kpi', 'metric', 'dashboard', 'data-viz'],
}
