import type { ComponentMeta } from '@cascade-ui/core'

export const meta: ComponentMeta = {
  name: 'Header',
  description: 'App top bar with brand, primary navigation links, and an actions slot',
  category: 'navigation',
  states: ['default'],
  variants: [],
  sizes: [],
  props: [
    {
      name: 'brand',
      type: 'React.ReactNode',
      required: false,
      description: 'Product name or logo area, typically wraps a link',
    },
    {
      name: 'links',
      type: '{ label: string; href: string; active?: boolean }[]',
      required: false,
      description: 'Primary navigation links; active link gets aria-current="page"',
    },
    {
      name: 'actions',
      type: 'React.ReactNode',
      required: false,
      description: 'Right-aligned slot for buttons or an avatar',
    },
    { name: 'sticky', type: 'boolean', required: false, default: 'false' },
    { name: 'className', type: 'string', required: false },
  ],
  tokens: [
    '--cascade-header-bg',
    '--cascade-color-surface',
    '--cascade-color-border',
    '--cascade-color-text',
    '--cascade-color-text-subtle',
    '--cascade-color-bg-subtle',
    '--cascade-focus-ring',
    '--cascade-z-raised',
  ],
  accessibility: {
    role: 'banner',
    wcag: 'AA',
    keyboard: ['Tab'],
  },
  examples: [
    {
      title: 'Basic',
      code: "<Header brand=\"cascade\" links={[{ label: 'Docs', href: '/docs' }]} />",
    },
    {
      title: 'With actions',
      code: '<Header brand="cascade" actions={<Button size="sm">Sign in</Button>} />',
    },
    {
      title: 'Sticky',
      code: '<Header sticky brand="cascade" links={links} />',
    },
  ],
  dependencies: ['@cascade-ui/core', '@cascade-ui/i18n'],
  tags: ['navigation', 'app-shell', 'top-bar', 'banner'],
}
