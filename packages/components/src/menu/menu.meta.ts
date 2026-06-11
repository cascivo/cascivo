import type { ComponentMeta } from '@cascade-ui/core'

export const meta: ComponentMeta = {
  name: 'Menu',
  description: 'Dropdown menu with keyboard navigation, built on usePopover',
  category: 'overlay',
  states: ['open', 'closed'],
  variants: [],
  sizes: [],
  props: [],
  tokens: [
    '--cascade-color-surface',
    '--cascade-color-border',
    '--cascade-radius-md',
    '--cascade-shadow-md',
    '--cascade-motion-enter',
    '--cascade-motion-exit',
    '--cascade-color-bg-subtle',
  ],
  accessibility: {
    role: 'menu',
    wcag: 'AA',
    keyboard: ['ArrowDown', 'ArrowUp', 'Enter', 'Space', 'Escape'],
  },
  examples: [],
  dependencies: ['@cascade-ui/core'],
  tags: ['overlay', 'menu', 'dropdown', 'floating'],
}
