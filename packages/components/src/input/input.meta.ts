import type { ComponentMeta } from '@cascade-ui/core'

export const meta: ComponentMeta = {
  name: 'Input',
  description: 'Text input field with optional label, hint, and error state',
  category: 'inputs',
  states: ['idle', 'focused', 'error'],
  variants: [],
  sizes: ['sm', 'md', 'lg'],
  props: [
    { name: 'label', type: 'string', required: false },
    { name: 'hint', type: 'string', required: false },
    { name: 'error', type: 'string', required: false },
    { name: 'size', type: "'sm' | 'md' | 'lg'", required: false, default: 'md' },
    { name: 'placeholder', type: 'string', required: false },
    { name: 'disabled', type: 'boolean', required: false, default: 'false' },
  ],
  tokens: [
    '--cascade-color-surface',
    '--cascade-color-border',
    '--cascade-color-accent',
    '--cascade-color-destructive',
    '--cascade-radius-input',
    '--cascade-focus-ring',
  ],
  accessibility: {
    role: 'textbox',
    wcag: 'AA',
    keyboard: ['Tab', 'Shift+Tab'],
  },
  examples: [
    { title: 'With label', code: '<Input label="Email" placeholder="you@example.com" />' },
    { title: 'With error', code: '<Input label="Email" error="Invalid email address" />' },
  ],
  dependencies: ['@cascade-ui/core'],
  tags: ['form', 'text', 'input'],
}
