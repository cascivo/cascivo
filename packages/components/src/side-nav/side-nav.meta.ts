import type { ComponentMeta } from '@cascade-ui/core'

export const meta: ComponentMeta = {
  name: 'SideNav',
  description: 'Collapsible sidebar navigation with optional icons and one level of grouping',
  category: 'navigation',
  states: ['expanded', 'collapsed'],
  variants: [],
  sizes: [],
  props: [
    {
      name: 'items',
      type: 'SideNavItem[]',
      required: true,
      description:
        '{ label, href?, icon?, active?, items? } — items with nested items render as expandable groups',
    },
    {
      name: 'collapsed',
      type: 'boolean',
      required: false,
      description: 'Controlled collapsed state (rail mode)',
    },
    { name: 'defaultCollapsed', type: 'boolean', required: false, default: 'false' },
    { name: 'onCollapsedChange', type: '(collapsed: boolean) => void', required: false },
    { name: 'ariaLabel', type: 'string', required: false, default: 'Side navigation' },
    { name: 'collapseLabel', type: 'string', required: false, default: 'Collapse navigation' },
    { name: 'expandLabel', type: 'string', required: false, default: 'Expand navigation' },
    { name: 'className', type: 'string', required: false },
  ],
  tokens: [
    '--cascade-sidenav-inline-size',
    '--cascade-sidenav-rail-inline-size',
    '--cascade-sidenav-bg',
    '--cascade-color-surface',
    '--cascade-color-border',
    '--cascade-color-text',
    '--cascade-color-text-subtle',
    '--cascade-color-bg-subtle',
    '--cascade-color-accent',
    '--cascade-color-accent-subtle',
    '--cascade-focus-ring',
    '--cascade-motion-enter',
    '--cascade-motion-exit',
    '--cascade-motion-emphasis',
  ],
  accessibility: {
    role: 'navigation',
    wcag: 'AA',
    keyboard: ['Tab', 'Enter', 'Space'],
  },
  examples: [
    {
      title: 'Basic',
      code: "<SideNav items={[{ label: 'Home', href: '/', active: true }, { label: 'Reports', href: '/reports' }]} />",
    },
    {
      title: 'With a group',
      code: "<SideNav items={[{ label: 'Settings', items: [{ label: 'Profile', href: '/profile' }] }]} />",
    },
    {
      title: 'Collapsed rail',
      code: '<SideNav defaultCollapsed items={items} />',
    },
  ],
  dependencies: ['@cascade-ui/core'],
  tags: ['navigation', 'sidebar', 'app-shell', 'collapsible'],
}
