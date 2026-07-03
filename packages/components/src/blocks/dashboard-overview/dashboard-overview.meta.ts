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
  intent: {
    whenToUse: [
      'Landing view of a dashboard summarizing headline KPIs (revenue, users, orders, conversion) at a glance',
      'A stat-card row with up/down deltas versus the previous period, placed above detail views',
    ],
    whenNotToUse: [
      'Browsing row-level records — use dashboard-table',
      'Trends over time that need charts — the cards show single values and deltas only',
    ],
    related: [
      {
        name: 'dashboard-table',
        relationship: 'pairs-with',
        reason: 'Overview KPIs on top, record-level table below is the canonical dashboard page',
      },
      {
        name: 'app-shell',
        relationship: 'contained-by',
        reason: 'Designed to render inside the app shell’s content area',
      },
      {
        name: 'Badge',
        relationship: 'contains',
        reason: 'Deltas render as success/destructive Badges keyed to trend direction',
      },
    ],
  },
}
