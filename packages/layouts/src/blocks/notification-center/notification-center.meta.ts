import type { ComponentMeta } from '@cascivo/core'

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
  accessibility: { role: 'generic', wcag: '2.1-AA', keyboard: [] },
  examples: [
    { title: 'Default', code: '<NotificationCenter />', description: 'Notification center' },
  ],
  dependencies: ['@cascivo/react'],
  registryDependencies: ['layout/flex'],
  tags: ['block', 'notifications', 'alerts'],
  intent: {
    whenToUse: [
      'A list of notification alerts with a mark-all-read action',
      'An inbox or activity panel surfaced from a header bell',
    ],
    whenNotToUse: [
      'Transient feedback after an action — use a Toast',
      'A single inline status message — use an Alert',
    ],
    antiPatterns: [],
    related: [
      {
        name: 'Alert',
        relationship: 'contains',
        reason: 'Each notification is rendered as an alert item',
      },
    ],
    a11yRationale: 'Notification items use alert semantics so screen readers announce new entries.',
    flexibility: [],
  },
}
