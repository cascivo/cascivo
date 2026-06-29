import type { ComponentMeta } from '@cascivo/core'

export const meta: ComponentMeta = {
  name: 'SidebarApp',
  description: 'Full app shell with collapsible side navigation and top header.',
  category: 'display',
  states: [],
  variants: [],
  sizes: [],
  props: [],
  tokens: [],
  accessibility: { role: 'generic', wcag: '2.1-AA', keyboard: [] },
  examples: [
    { title: 'Default', code: '<SidebarApp />', description: 'App with sidebar navigation' },
  ],
  dependencies: ['@cascivo/react'],
  registryDependencies: ['layout/app-shell'],
  tags: ['block', 'sidebar', 'navigation', 'app-shell'],
  intent: {
    whenToUse: [
      'A ready-made app shell with opinionated collapsible sidebar and top header',
      'Standing up an authenticated app frame quickly',
    ],
    whenNotToUse: [
      'You want a bare shell to compose your own nav — use AppShell',
      'A dashboard-specific layout — use DashboardLayout',
    ],
    antiPatterns: [],
    related: [
      {
        name: 'AppShell',
        relationship: 'alternative',
        reason: 'Use the bare layout primitive for custom navigation',
      },
      {
        name: 'ConsoleApp',
        relationship: 'alternative',
        reason: 'Use the Carbon-parity console shell for icon-rail navigation',
      },
    ],
    a11yRationale: 'Provides header and navigation landmarks for screen reader orientation.',
    flexibility: [],
  },
}
