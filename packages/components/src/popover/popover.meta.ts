import type { ComponentMeta } from '@cascade-ui/core'

export const meta: ComponentMeta = {
  name: 'Popover',
  description: 'Anchored floating panel built on CSS Anchor Positioning + Popover API',
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
  ],
  accessibility: {
    role: 'dialog',
    wcag: 'AA',
    keyboard: ['Escape'],
  },
  examples: [],
  dependencies: ['@cascade-ui/core'],
  tags: ['overlay', 'floating', 'anchor', 'popover'],
}
