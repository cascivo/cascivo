import type { ComponentMeta } from '@cascivo/core'

export const meta: ComponentMeta = {
  name: 'AppFrame',
  description:
    'Full-page application shell with persisted collapsible sidebar. Includes a signal-driven top progress bar with determinate progress, error state, and dismissible error strip.',
  category: 'layout',
  // Header, nav and content render; JS drives the persisted collapse and the progress bar.
  clientJs: 'enhancement',
  states: ['expanded', 'collapsed', 'loading', 'error'],
  variants: [],
  sizes: [],
  props: [
    {
      name: 'footer',
      type: 'ReactNode',
      required: false,
      description: 'Optional sticky footer rendered below the content area.',
    },
    {
      name: 'sideNavMode',
      type: "'push' | 'overlay'",
      required: false,
      description:
        'push (default): sidebar takes grid space; overlay: sidebar floats over content.',
      default: 'push',
    },
    { name: 'header', type: 'ReactNode', required: true, description: 'Top header slot' },
    { name: 'sideNav', type: 'ReactNode', required: false, description: 'Side navigation slot' },
    { name: 'aside', type: 'ReactNode', required: false, description: 'Right aside slot' },
    { name: 'children', type: 'ReactNode', required: true, description: 'Main content' },
    {
      name: 'persistKey',
      default: 'cascade.appshell',
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
    '--cascivo-space-3',
    '--cascivo-space-4',
    '--cascivo-space-6',
    '--cascivo-duration-200',
    '--cascivo-ease-out',
    '--cascivo-color-border',
    '--cascivo-color-surface',
    '--cascivo-text-xs',
    '--cascivo-color-accent',
    '--cascivo-color-destructive',
    '--cascivo-color-destructive-subtle',
    '--cascivo-focus-ring',
  ],
  accessibility: { role: 'generic', wcag: '2.1-AA', keyboard: [] },
  examples: [
    {
      title: 'Basic',
      code: '<AppFrame header={<Header />} sideNav={<Nav />}>content</AppFrame>',
      description: 'App shell with collapsible nav',
    },
  ],
  dependencies: ['@cascivo/core', '@cascivo/i18n', '@cascivo/storage'],
  tags: ['layout', 'shell', 'sidebar', 'navigation'],
  intent: {
    whenToUse: [
      'A full-page application frame with header, collapsible sidebar, and content',
      'You need a bare shell to compose your own navigation into',
    ],
    whenNotToUse: [
      'You want opinionated, prewired sidebar navigation — use SidebarApp',
      'A simple centered content page — use Section or Center',
      'You just need a drop-in header + toggleable nav with no persistence — use the published `AppShell` from @cascivo/react (a `nav` prop, no copy-paste), not this richer copy-paste shell.',
    ],
    antiPatterns: [],
    related: [
      {
        name: 'AppShell (@cascivo/react)',
        relationship: 'alternative',
        reason:
          'The published, self-contained AppShell: header + a single `nav` slot with an animated accessible drawer, no persistence/progress/aside. Simpler prop surface (`nav` vs this frame’s `sideNav`/`aside`/`persistKey`/`state`). Use it for a quick drop-in; use this copy-paste frame when you need persisted collapse, a progress bar, or a right aside. This entry used to be called `AppShell` too — one name for two incompatible prop surfaces — and was renamed to `AppFrame` so an import can only mean one thing.',
      },
      {
        name: 'SidebarApp',
        relationship: 'alternative',
        reason: 'Use the opinionated block when you want prewired sidebar nav',
      },
      {
        name: 'DashboardLayout',
        relationship: 'alternative',
        reason: 'Use for a stats-strip dashboard page rather than a bare shell',
      },
    ],
    a11yRationale:
      'Provides landmark structure with header and navigation regions for screen reader orientation.',
    flexibility: [],
  },
}
