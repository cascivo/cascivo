import type { ComponentMeta } from '@cascade-ui/core'

export const meta: ComponentMeta = {
  name: 'SidebarApp',
  description: 'Full app shell with collapsible side navigation and top header.',
  category: 'display',
  states: [],
  variants: [],
  sizes: [],
  props: [],
  tokens: [],
  accessibility: { role: 'generic', wcag: 'AA', keyboard: [] },
  examples: [
    { title: 'Default', code: '<SidebarApp />', description: 'App with sidebar navigation' },
  ],
  dependencies: ['@cascade-ui/react', 'layout/app-shell'],
  tags: ['block', 'sidebar', 'navigation', 'app-shell'],
}
