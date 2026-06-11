import type { ComponentMeta } from '@cascade-ui/core'

export const meta: ComponentMeta = {
  name: 'AlertDialog',
  description: 'Confirmation dialog requiring explicit user action; no light-dismiss',
  category: 'overlay',
  states: ['open', 'closed'],
  variants: ['default', 'destructive'],
  sizes: [],
  props: [],
  tokens: [
    '--cascade-color-surface',
    '--cascade-color-border',
    '--cascade-radius-lg',
    '--cascade-shadow-xl',
    '--cascade-motion-enter',
    '--cascade-motion-exit',
    '--cascade-color-accent',
    '--cascade-color-destructive',
  ],
  accessibility: {
    role: 'alertdialog',
    wcag: 'AA',
    keyboard: ['Tab', 'Shift+Tab', 'Enter', 'Space'],
  },
  examples: [],
  dependencies: ['@cascade-ui/core', '@cascade-ui/i18n'],
  tags: ['overlay', 'dialog', 'confirm', 'destructive'],
}
