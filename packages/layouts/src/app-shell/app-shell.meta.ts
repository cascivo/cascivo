import type { ComponentMeta } from '@cascade-ui/core'

export const meta: ComponentMeta = {
  name: 'AppShell',
  description: 'Full-page application shell with persisted collapsible sidebar.',
  category: 'layout',
  states: ['expanded', 'collapsed'],
  variants: [],
  sizes: [],
  props: [
    { name: 'header', type: 'ReactNode', required: true, description: 'Top header slot' },
    { name: 'sideNav', type: 'ReactNode', required: false, description: 'Side navigation slot' },
    { name: 'aside', type: 'ReactNode', required: false, description: 'Right aside slot' },
    { name: 'children', type: 'ReactNode', required: true, description: 'Main content' },
    {
      name: 'persistKey',
      type: 'string | false',
      required: false,
      description: 'localStorage key prefix. Pass false to disable persistence.',
    },
    {
      name: 'state',
      type: 'ShellState',
      required: false,
      description: 'External shell state from createShellState(). Created internally when omitted.',
    },
  ],
  tokens: [
    '--cascade-space-3',
    '--cascade-space-4',
    '--cascade-space-6',
    '--cascade-duration-200',
    '--cascade-ease-out',
    '--cascade-color-border',
    '--cascade-color-surface',
    '--cascade-font-size-xs',
  ],
  accessibility: { role: 'generic', wcag: 'AA', keyboard: [] },
  examples: [
    {
      title: 'Basic',
      code: '<AppShell header={<Header />} sideNav={<Nav />}>content</AppShell>',
      description: 'App shell with collapsible nav',
    },
  ],
  dependencies: ['@cascade-ui/core', '@cascade-ui/i18n', '@cascade-ui/storage'],
  tags: ['layout', 'shell', 'sidebar', 'navigation'],
}
