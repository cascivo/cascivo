import type { ComponentMeta } from '@cascade-ui/core'

export const meta: ComponentMeta = {
  name: 'PageWithBreadcrumb',
  description: 'A centered content page with a breadcrumb navigation and page header.',
  category: 'display',
  states: [],
  variants: [],
  sizes: [],
  props: [],
  tokens: [],
  accessibility: { role: 'generic', wcag: 'AA', keyboard: [] },
  examples: [
    { title: 'Default', code: '<PageWithBreadcrumb />', description: 'Page with breadcrumb' },
  ],
  dependencies: ['@cascade-ui/react', 'layout/page-header', 'layout/center'],
  tags: ['block', 'breadcrumb', 'page', 'navigation'],
}
