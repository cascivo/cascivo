import type { ComponentMeta } from '@cascade-ui/core'

export const meta: ComponentMeta = {
  name: 'Checkbox',
  description: 'Binary toggle for forms, with indeterminate support',
  category: 'inputs',
  states: ['unchecked', 'checked', 'indeterminate'],
  variants: [],
  sizes: [],
  props: [
    { name: 'label', type: 'string', required: false },
    { name: 'checked', type: 'boolean', required: false },
    { name: 'indeterminate', type: 'boolean', required: false, default: 'false' },
    { name: 'disabled', type: 'boolean', required: false, default: 'false' },
    { name: 'onChange', type: 'React.ChangeEventHandler<HTMLInputElement>', required: false },
  ],
  tokens: [
    '--cascade-color-surface',
    '--cascade-color-accent',
    '--cascade-color-border-strong',
    '--cascade-color-text-on-accent',
    '--cascade-radius-sm',
    '--cascade-focus-ring',
  ],
  accessibility: {
    role: 'checkbox',
    wcag: 'AA',
    keyboard: ['Space'],
  },
  examples: [
    { title: 'With label', code: '<Checkbox label="Accept terms" />' },
    { title: 'Indeterminate', code: '<Checkbox label="Select all" indeterminate />' },
  ],
  dependencies: ['@cascade-ui/core'],
  tags: ['form', 'toggle', 'boolean'],
}
