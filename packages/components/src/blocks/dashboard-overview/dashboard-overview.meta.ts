import type { BlockMeta } from '../types'

export const meta: BlockMeta = {
  name: 'dashboard-overview',
  displayName: 'Dashboard Overview',
  description: 'Welcome header with four KPI stat cards (revenue, users, orders, conversion).',
  category: 'dashboard',
  tags: ['dashboard', 'stats', 'kpi', 'cards', 'overview'],
  screenshot: {
    light: '/blocks/screenshots/dashboard-overview-light.png',
    dark: '/blocks/screenshots/dashboard-overview-dark.png',
  },
}
