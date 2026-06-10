import type { ComponentMeta } from '@cascade-ui/core'

export const meta: ComponentMeta = {
  name: 'SettingsLayout',
  description: 'Two-column settings page layout with a fixed-width menu and fluid content area.',
  category: 'layout',
  states: [],
  variants: [],
  sizes: [],
  props: [
    { name: 'menu', type: 'ReactNode', required: true, description: 'Side navigation menu' },
    { name: 'children', type: 'ReactNode', required: true, description: 'Settings content area' },
  ],
  tokens: ['--cascade-space-8'],
  accessibility: { role: 'generic', wcag: 'AA', keyboard: [] },
  examples: [
    {
      title: 'Basic',
      code: '<SettingsLayout menu={<nav>Menu</nav>}><div>Settings</div></SettingsLayout>',
      description: 'Menu + content layout',
    },
  ],
  dependencies: ['@cascade-ui/core'],
  tags: ['layout', 'settings', 'page'],
}
