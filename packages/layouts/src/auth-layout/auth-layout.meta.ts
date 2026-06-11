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
    '--cascade-color-bg-subtle',
    '--cascade-color-surface',
    '--cascade-color-border',
    '--cascade-radius-lg',
    '--cascade-space-4',
    '--cascade-space-6',
    '--cascade-space-8',
  ],
  accessibility: { role: 'generic', wcag: 'AA', keyboard: [] },
  examples: [
    {
      title: 'Login',
      code: '<AuthLayout logo={<img src="/logo.svg" alt="Logo" />}><form>...</form></AuthLayout>',
      description: 'Centered auth card with logo',
    },
  ],
  dependencies: ['@cascade-ui/core'],
  tags: ['layout', 'auth', 'login', 'page'],
}
