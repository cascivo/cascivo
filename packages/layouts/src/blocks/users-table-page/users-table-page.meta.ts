import type { ComponentMeta } from '@cascade-ui/core'

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
  accessibility: { role: 'generic', wcag: 'AA', keyboard: [] },
  examples: [{ title: 'Default', code: '<UsersTablePage />', description: 'Demo users table' }],
  dependencies: ['@cascade-ui/react', 'layout/page-header', 'layout/stack'],
  tags: ['block', 'users', 'table', 'page'],
}
