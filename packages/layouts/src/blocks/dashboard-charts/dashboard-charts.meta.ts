import type { ComponentMeta } from '@cascivo/core'

export const meta: ComponentMeta = {
  name: 'DashboardCharts',
  description: 'Dashboard layout with KPI tiles, line chart, bar chart, and pie chart.',
  category: 'display',
  states: [],
  variants: [],
  sizes: [],
  props: [
    {
      name: 'className',
      description: 'Additional CSS class names merged onto the root DashboardLayout element.',
      type: 'string',
      required: false,
    },
  ],
  tokens: [],
  accessibility: { role: 'generic', wcag: '2.1-AA', keyboard: [] },
  examples: [
    { title: 'Default', code: '<DashboardCharts />', description: 'Charts dashboard demo' },
  ],
  dependencies: ['@cascivo/charts', '@cascivo/react'],
  registryDependencies: ['layout/dashboard-layout'],
  tags: ['block', 'dashboard', 'charts', 'kpi'],
  intent: {
    whenToUse: [
      'A prebuilt dashboard with KPI tiles, line, bar, and pie charts',
      'Quickly demonstrating or scaffolding an analytics overview',
    ],
    whenNotToUse: [
      'You only need the layout frame — use DashboardLayout',
      'A single metric display — use a Kpi card',
    ],
    antiPatterns: [],
    related: [
      {
        name: 'DashboardLayout',
        relationship: 'contained-by',
        reason: 'Composes the dashboard layout frame',
      },
      {
        name: 'StatsCards',
        relationship: 'alternative',
        reason: 'Use when you only need the KPI tile row',
      },
    ],
    a11yRationale: 'Charts within render with role="img" and titled labels for screen readers.',
    flexibility: [],
  },
}
