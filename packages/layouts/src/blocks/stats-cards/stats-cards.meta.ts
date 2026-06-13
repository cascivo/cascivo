import type { ComponentMeta } from '@cascivo/core'

export const meta: ComponentMeta = {
  name: 'StatsCards',
  description: 'Grid of KPI stat cards with trend badges.',
  category: 'display',
  states: [],
  variants: [],
  sizes: [],
  props: [{ name: 'stats', type: 'Stat[]', required: false, description: 'KPI stat data' }],
  tokens: [],
  accessibility: { role: 'generic', wcag: '2.1-AA', keyboard: [] },
  examples: [{ title: 'Default', code: '<StatsCards />', description: 'Demo KPI stats' }],
  dependencies: ['@cascivo/react'],
  tags: ['block', 'stats', 'kpi', 'cards'],
  intent: {
    whenToUse: [
      'A grid of KPI stat cards with trend badges',
      'Summarising headline metrics at the top of a dashboard',
    ],
    whenNotToUse: [
      'A full charts dashboard — use DashboardCharts',
      'A single metric — use a Kpi card',
    ],
    antiPatterns: [],
    related: [
      {
        name: 'Kpi',
        relationship: 'contains',
        reason: 'Each card displays a KPI metric with a delta',
      },
      {
        name: 'DashboardLayout',
        relationship: 'contained-by',
        reason: 'Commonly fills the dashboard stats strip',
      },
    ],
    a11yRationale: 'Each stat card is a labeled figure for screen reader context.',
    flexibility: [],
  },
}
