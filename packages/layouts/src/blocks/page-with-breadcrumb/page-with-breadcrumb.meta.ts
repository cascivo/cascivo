import type { ComponentMeta } from '@cascivo/core'

export const meta: ComponentMeta = {
  name: 'PageWithBreadcrumb',
  description: 'A centered content page with a breadcrumb navigation and page header.',
  category: 'display',
  states: [],
  variants: [],
  sizes: [],
  props: [],
  tokens: [],
  accessibility: { role: 'generic', wcag: '2.1-AA', keyboard: [] },
  examples: [
    { title: 'Default', code: '<PageWithBreadcrumb />', description: 'Page with breadcrumb' },
  ],
  dependencies: ['@cascivo/react'],
  registryDependencies: ['layout/page-header', 'layout/center'],
  tags: ['block', 'breadcrumb', 'page', 'navigation'],
  intent: {
    whenToUse: [
      'A centered content page with breadcrumb navigation and a page header',
      'Deep pages where users need hierarchical context',
    ],
    whenNotToUse: [
      'Top-level pages with no hierarchy to express',
      'You only need the header without breadcrumbs — use PageHeader',
    ],
    antiPatterns: [],
    related: [
      {
        name: 'PageHeader',
        relationship: 'contains',
        reason: 'Uses a page header with a breadcrumb slot',
      },
    ],
    a11yRationale:
      'Breadcrumb renders as a labeled navigation region for screen reader orientation.',
    flexibility: [],
  },
}
