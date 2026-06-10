import type { ComponentMeta } from '@cascade-ui/core'

export const meta: ComponentMeta = {
  name: 'TimePicker',
  description: 'Native time input wrapper with label, hint, error, and size variants',
  category: 'inputs',
  states: ['idle', 'focused', 'error'],
  variants: [],
  sizes: ['sm', 'md', 'lg'],
  props: [
    { name: 'value', type: 'string', required: false, description: 'Controlled value (HH:mm)' },
    { name: 'defaultValue', type: 'string', required: false },
    { name: 'onChange', type: '(value: string) => void', required: false },
    { name: 'min', type: 'string', required: false },
    { name: 'max', type: 'string', required: false },
    { name: 'step', type: 'number', required: false },
    { name: 'label', type: 'string', required: false },
    { name: 'hint', type: 'string', required: false },
    { name: 'error', type: 'string', required: false },
    { name: 'size', type: "'sm' | 'md' | 'lg'", required: false, default: "'md'" },
    { name: 'disabled', type: 'boolean', required: false },
    { name: 'className', type: 'string', required: false },
  ],
  tokens: [
    '--cascade-color-surface',
    '--cascade-color-bg-subtle',
    '--cascade-color-border',
    '--cascade-color-border-strong',
    '--cascade-color-text',
    '--cascade-color-text-muted',
    '--cascade-color-accent',
    '--cascade-color-danger',
    '--cascade-radius-input',
    '--cascade-radius-md',
  ],
  accessibility: {
    role: 'textbox',
    wcag: 'AA',
    keyboard: ['Tab'],
  },
  examples: [
    {
      title: 'Basic time picker',
      code: `<TimePicker label="Meeting time" onChange={(v) => console.log(v)} />`,
    },
  ],
  dependencies: ['@cascade-ui/core'],
  tags: ['time', 'input', 'form'],
}
