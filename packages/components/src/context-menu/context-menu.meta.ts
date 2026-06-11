import type { ComponentMeta } from '@cascade-ui/core'

export const meta: ComponentMeta = {
  name: 'ContextMenu',
  description: 'Right-click context menu anchored at pointer coordinates via CSS custom properties',
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
  tags: ['overlay', 'menu', 'context', 'right-click'],
}
