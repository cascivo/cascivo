import type { ComponentMeta } from '@cascade-ui/core'

export const meta: ComponentMeta = {
  name: 'AuthLayout',
  description: 'Centered card layout for authentication pages (login, register, forgot password).',
  category: 'layout',
  states: [],
  variants: [],
  sizes: [],
  props: [
    { name: 'children', type: 'ReactNode', required: true, description: 'Auth form content' },
    {
      name: 'logo',
      type: 'ReactNode',
      required: false,
      description: 'Optional logo displayed above the form',
    },
  ],
  tokens: [
    '--cascivo-color-bg-subtle',
    '--cascivo-color-surface',
    '--cascivo-color-border',
    '--cascivo-radius-lg',
    '--cascivo-space-4',
    '--cascivo-space-6',
    '--cascivo-space-8',
  ],
  accessibility: { role: 'generic', wcag: '2.1-AA', keyboard: [] },
  examples: [
    {
      title: 'Login',
      code: '<AuthLayout logo={<img src="/logo.svg" alt="Logo" />}><form>...</form></AuthLayout>',
      description: 'Centered auth card with logo',
    },
  ],
  dependencies: ['@cascade-ui/core'],
  tags: ['layout', 'auth', 'login', 'page'],
  intent: {
    whenToUse: [
      'Centered card layout for authentication pages — login, register, reset',
      'Focused single-task pages with an optional logo and minimal chrome',
    ],
    whenNotToUse: [
      'General centered content — use Center',
      'A full app frame after sign-in — use AppShell or SidebarApp',
    ],
    antiPatterns: [],
    related: [
      {
        name: 'LoginPage',
        relationship: 'contains',
        reason: 'The login page block renders inside this layout',
      },
      {
        name: 'Center',
        relationship: 'alternative',
        reason: 'Use for plain centering without the auth card framing',
      },
    ],
    a11yRationale: 'Provides a main landmark wrapping the focused auth content.',
    flexibility: [],
  },
}
