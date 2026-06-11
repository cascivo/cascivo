import type { ComponentMeta } from '@cascade-ui/core'

export const meta: ComponentMeta = {
  name: 'HoverCard',
  description: 'Hover-triggered popover with configurable open/close delay',
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
    role: 'complementary',
    wcag: 'AA',
    keyboard: ['Tab', 'Escape'],
  },
  examples: [],
  dependencies: ['@cascade-ui/core'],
  tags: ['overlay', 'hover', 'preview', 'floating'],
}
