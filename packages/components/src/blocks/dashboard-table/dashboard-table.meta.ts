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
}
