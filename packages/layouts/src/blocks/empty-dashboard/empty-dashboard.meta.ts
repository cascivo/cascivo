import type { ComponentMeta } from '@cascade-ui/core'

export const meta: ComponentMeta = {
  name: 'EmptyDashboard',
  description: 'Dashboard page showing an empty state with a call-to-action button.',
  category: 'display',
  states: [],
  variants: [],
  sizes: [],
  props: [
    {
      name: 'onCreateItem',
      type: '() => void',
      required: false,
      description: 'Create item button handler',
    },
  ],
  tokens: [],
  accessibility: { role: 'generic', wcag: 'AA', keyboard: [] },
  examples: [{ title: 'Default', code: '<EmptyDashboard />', description: 'Empty dashboard' }],
  dependencies: ['@cascade-ui/react', 'layout/dashboard-layout'],
  tags: ['block', 'dashboard', 'empty-state', 'page'],
}
