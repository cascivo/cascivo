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
    wcag: '2.2-AA',
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
  intent: {
    whenToUse: [
      'Listing sibling apps/products the user can switch between',
      'Rendering switch destinations inside a HeaderPanel opened from the shell header',
      'Grouping switch targets with dividers and marking the active one',
    ],
    whenNotToUse: [
      'Primary in-app navigation — use SideNav',
      'A small action menu attached to a control — use Dropdown',
    ],
    antiPatterns: [
      {
        bad: 'Using Switcher as the main page navigation',
        good: '<SideNav> for primary navigation; Switcher only for app/product switching',
        why: 'Switcher models cross-app jumps, not navigation within the current app',
      },
    ],
    related: [
      {
        name: 'HeaderPanel',
        relationship: 'contained-by',
        reason: 'Switcher is placed inside a HeaderPanel opened by a ShellHeader action',
      },
    ],
    a11yRationale:
      'role="list" structures the entries; each switch target is a real link with the active destination marked, so keyboard and screen-reader users can identify and reach the current app',
    flexibility: [
      {
        area: 'dividers',
        level: 'flexible',
        note: 'Dividers group entries as needed',
      },
      {
        area: 'token names',
        level: 'strict',
        note: 'Accent and surface colors must resolve to --cascade-* tokens',
      },
    ],
  },
}
