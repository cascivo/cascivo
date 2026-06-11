import type { ComponentMeta } from '@cascade-ui/core'

export const meta: ComponentMeta = {
  name: 'Switcher',
  description:
    'App/product switcher list — lives inside HeaderPanel, renders links with active indicator and optional dividers',
  category: 'navigation',
  states: ['default'],
  variants: [],
  sizes: [],
  props: [
    {
      name: 'items',
      type: 'SwitcherEntry[]',
      required: true,
      description: 'SwitcherLink ({ label, href, active?, icon? }) or divider ({ divider: true })',
    },
    { name: 'label', type: 'string', required: false, default: 'Switch application' },
    { name: 'className', type: 'string', required: false },
  ],
  tokens: [
    '--cascade-color-text',
    '--cascade-color-bg-subtle',
    '--cascade-color-accent',
    '--cascade-color-accent-subtle',
    '--cascade-color-border',
    '--cascade-focus-ring',
  ],
  accessibility: {
    role: 'list',
    wcag: 'AA',
    keyboard: ['Tab', 'Enter'],
  },
  examples: [
    {
      title: 'App switcher',
      code: `<Switcher
  items={[
    { label: 'Console', href: '/console', active: true },
    { label: 'Billing', href: '/billing' },
    { divider: true },
    { label: 'Docs', href: 'https://docs.example.com' },
  ]}
/>`,
      description: 'Place inside a HeaderPanel opened by a Grid action in ShellHeader',
    },
  ],
  dependencies: ['@cascade-ui/core', '@cascade-ui/i18n'],
  tags: ['navigation', 'switcher', 'shell', 'console', 'app-switcher'],
}
