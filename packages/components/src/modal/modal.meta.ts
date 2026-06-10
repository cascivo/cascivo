import type { ComponentMeta } from '@cascade-ui/core'

export const meta: ComponentMeta = {
  name: 'Modal',
  description: 'Accessible dialog overlay using native <dialog> element',
  category: 'overlay',
  states: ['closed', 'open'],
  variants: [],
  sizes: ['sm', 'md', 'lg'],
  props: [
    { name: 'open', type: 'boolean', required: false, default: 'false' },
    { name: 'onClose', type: '() => void', required: false },
    { name: 'title', type: 'string', required: false },
    { name: 'description', type: 'string', required: false },
    { name: 'size', type: "'sm' | 'md' | 'lg'", required: false, default: 'md' },
  ],
  tokens: [
    '--cascade-color-surface-overlay',
    '--cascade-color-border',
    '--cascade-radius-modal',
    '--cascade-shadow-xl',
    '--cascade-focus-ring',
  ],
  accessibility: {
    role: 'dialog',
    wcag: 'AA',
    keyboard: ['Escape', 'Tab', 'Shift+Tab'],
  },
  examples: [
    {
      title: 'Basic modal',
      code: `<Modal open={isOpen} onClose={() => setIsOpen(false)} title="Confirm action">\n  <p>Are you sure?</p>\n</Modal>`,
    },
  ],
  dependencies: ['@cascade-ui/core', '@cascade-ui/i18n'],
  tags: ['overlay', 'dialog', 'popup'],
}
