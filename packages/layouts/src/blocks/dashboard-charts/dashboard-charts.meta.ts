import type { ComponentMeta } from '@cascade-ui/core'

export const meta: ComponentMeta = {
  name: 'DashboardCharts',
  description: 'Dashboard layout with KPI tiles, line chart, bar chart, and pie chart.',
  category: 'display',
  states: [],
  variants: [],
  sizes: [],
  props: [],
  tokens: [],
  accessibility: { role: 'generic', wcag: 'AA', keyboard: [] },
  examples: [
    { title: 'Default', code: '<DashboardCharts />', description: 'Charts dashboard demo' },
  ],
  dependencies: ['@cascade-ui/charts', '@cascade-ui/react'],
  tags: ['block', 'dashboard', 'charts', 'kpi'],
}
