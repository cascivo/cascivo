import type { ComponentMeta } from '@cascade-ui/core'

export const meta: ComponentMeta = {
  name: 'Sheet',
  description: 'Slide-in panel from any edge, using popover=manual and @starting-style animations',
  category: 'overlay',
  states: ['open', 'closed'],
  variants: [],
  sizes: [],
  props: [],
  tokens: [
    '--cascade-color-surface',
    '--cascade-color-border',
    '--cascade-radius-lg',
    '--cascade-shadow-xl',
    '--cascade-motion-enter',
    '--cascade-motion-exit',
  ],
  accessibility: {
    role: 'dialog',
    wcag: 'AA',
    keyboard: ['Escape', 'Tab', 'Shift+Tab'],
  },
  examples: [],
  dependencies: ['@cascade-ui/core', '@cascade-ui/i18n'],
  tags: ['overlay', 'drawer', 'panel', 'slide'],
}
