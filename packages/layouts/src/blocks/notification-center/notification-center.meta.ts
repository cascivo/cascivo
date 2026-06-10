import type { ComponentMeta } from '@cascade-ui/core'

export const meta: ComponentMeta = {
  name: 'NotificationCenter',
  description: 'A list of notification alerts with a mark-all-read action.',
  category: 'display',
  states: [],
  variants: [],
  sizes: [],
  props: [
    {
      name: 'notifications',
      type: 'Notification[]',
      required: false,
      description: 'Notification items to display',
    },
    {
      name: 'onMarkAllRead',
      type: '() => void',
      required: false,
      description: 'Mark all read button handler',
    },
  ],
  tokens: [],
  accessibility: { role: 'generic', wcag: 'AA', keyboard: [] },
  examples: [
    { title: 'Default', code: '<NotificationCenter />', description: 'Notification center' },
  ],
  dependencies: ['@cascade-ui/react', 'layout/stack'],
  tags: ['block', 'notifications', 'alerts'],
}
