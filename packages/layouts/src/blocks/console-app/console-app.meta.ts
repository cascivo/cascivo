import type { ComponentMeta } from '@cascade-ui/core'

export const meta: ComponentMeta = {
  name: 'ConsoleApp',
  description:
    'Carbon-parity console shell: ShellHeader + icon-rail SideNav + HeaderPanel notifications/switcher + collapsible aside + main content.',
  category: 'display',
  states: [],
  variants: [],
  sizes: [],
  props: [],
  tokens: [
    '--cascade-shell-header-block-size',
    '--cascade-shell-panel-inline-size',
    '--cascade-shell-aside-inline-size',
    '--cascade-color-border',
    '--cascade-color-surface',
    '--cascade-color-scrim',
    '--cascade-motion-enter',
    '--cascade-motion-exit',
  ],
  accessibility: { role: 'generic', wcag: 'AA', keyboard: ['Escape', 'Tab'] },
  examples: [{ title: 'Default', code: '<ConsoleApp />', description: 'Full console shell demo' }],
  dependencies: [
    '@cascade-ui/react',
    '@cascade-ui/icons',
    'layout/app-shell',
    'layout/page-header',
  ],
  tags: ['block', 'console', 'shell', 'navigation', 'carbon-parity'],
}
