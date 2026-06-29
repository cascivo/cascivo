import type { ComponentMeta } from '@cascivo/core'

export const meta: ComponentMeta = {
  name: 'UsersTablePage',
  description: 'Full users management page with table, search, and invite action.',
  category: 'display',
  states: [],
  variants: [],
  sizes: [],
  props: [
    { name: 'users', type: 'User[]', required: false, description: 'User data' },
    { name: 'onInvite', type: '() => void', required: false, description: 'Invite button handler' },
  ],
  tokens: [],
  accessibility: { role: 'generic', wcag: '2.1-AA', keyboard: [] },
  examples: [{ title: 'Default', code: '<UsersTablePage />', description: 'Demo users table' }],
  dependencies: ['@cascivo/react'],
  registryDependencies: ['layout/page-header', 'layout/stack'],
  tags: ['block', 'users', 'table', 'page'],
  intent: {
    whenToUse: [
      'A full user-management page with table, search, and invite action',
      'Admin list views over a collection of records',
    ],
    whenNotToUse: [
      'A read-only data display — use a plain Table',
      'A dashboard overview — use DashboardCharts',
    ],
    antiPatterns: [],
    related: [
      {
        name: 'PageHeader',
        relationship: 'contains',
        reason: 'Uses a page header with title and invite action',
      },
    ],
    a11yRationale: 'Table uses proper row/column semantics and the search field is labeled.',
    flexibility: [],
  },
}
