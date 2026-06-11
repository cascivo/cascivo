import type { ComponentMeta } from '@cascade-ui/core'

export const meta: ComponentMeta = {
  name: 'StatsCards',
  description: 'Grid of KPI stat cards with trend badges.',
  category: 'display',
  states: [],
  variants: [],
  sizes: [],
  props: [{ name: 'stats', type: 'Stat[]', required: false, description: 'KPI stat data' }],
  tokens: [],
  accessibility: { role: 'generic', wcag: 'AA', keyboard: [] },
  examples: [{ title: 'Default', code: '<StatsCards />', description: 'Demo KPI stats' }],
  dependencies: ['@cascade-ui/react'],
  tags: ['block', 'stats', 'kpi', 'cards'],
}
