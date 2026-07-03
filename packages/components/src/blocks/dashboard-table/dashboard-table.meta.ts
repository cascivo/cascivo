import type { BlockMeta } from '../types'

export const meta: BlockMeta = {
  name: 'dashboard-table',
  displayName: 'Dashboard Table',
  description: 'Searchable, sortable, paginated data table with export button.',
  category: 'dashboard',
  tags: ['dashboard', 'table', 'data', 'search', 'sort', 'pagination'],
  screenshot: {
    light: '/blocks/screenshots/dashboard-table-light.png',
    dark: '/blocks/screenshots/dashboard-table-dark.png',
  },
  intent: {
    whenToUse: [
      'Admin views listing records (customers, orders) with text search, column sorting, and pagination',
      'Tables where a status column benefits from Badge color coding (active/pending/inactive)',
    ],
    whenNotToUse: [
      'Aggregate metrics at a glance — use dashboard-overview',
      'Large server-side datasets — filtering, sorting, and paging here are all client-side over in-memory rows',
    ],
    related: [
      {
        name: 'dashboard-overview',
        relationship: 'pairs-with',
        reason: 'KPI cards above the record table is the canonical dashboard page',
      },
      {
        name: 'app-shell',
        relationship: 'contained-by',
        reason: 'Designed to render inside the app shell’s content area',
      },
    ],
  },
}
