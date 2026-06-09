import type { ComponentMeta } from '@cascade-ui/core'

export const meta: ComponentMeta = {
  name: 'Textarea',
  description: 'Multi-line text input with optional label, hint, and error state',
  category: 'inputs',
  states: ['idle', 'focused', 'error'],
  variants: [],
  sizes: [],
  props: [
    { name: 'label', type: 'string', required: false },
    { name: 'hint', type: 'string', required: false },
    { name: 'error', type: 'string', required: false },
    { name: 'rows', type: 'number', required: false, default: '4' },
    {
      name: 'resize',
      type: "'none' | 'vertical' | 'both'",
      required: false,
      default: 'vertical',
    },
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
    { title: 'With label', code: '<Textarea label="Message" placeholder="Type here…" />' },
    { title: 'With error', code: '<Textarea label="Bio" error="Bio is required" />' },
  ],
  dependencies: ['@cascade-ui/core'],
  tags: ['form', 'text', 'multiline'],
}
