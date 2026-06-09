import type { ComponentMeta } from '@cascade-ui/core'

export const meta: ComponentMeta = {
  name: 'Toggle',
  description: 'On/off switch built as an accessible button',
  category: 'inputs',
  states: ['off', 'on'],
  variants: [],
  sizes: ['sm', 'md'],
  props: [
    { name: 'checked', type: 'boolean', required: false },
    { name: 'defaultChecked', type: 'boolean', required: false, default: 'false' },
    { name: 'onChange', type: '(checked: boolean) => void', required: false },
    { name: 'label', type: 'string', required: false },
    { name: 'size', type: "'sm' | 'md'", required: false, default: 'md' },
    { name: 'disabled', type: 'boolean', required: false, default: 'false' },
  ],
  tokens: [
    '--cascade-color-accent',
    '--cascade-color-border-strong',
    '--cascade-color-surface',
    '--cascade-radius-full',
    '--cascade-focus-ring',
  ],
  accessibility: {
    role: 'switch',
    wcag: 'AA',
    keyboard: ['Space', 'Enter'],
  },
  examples: [
    { title: 'Uncontrolled', code: '<Toggle label="Notifications" defaultChecked />' },
    {
      title: 'Controlled',
      code: '<Toggle checked={enabled} onChange={setEnabled} label="Dark mode" />',
    },
  ],
  dependencies: ['@cascade-ui/core'],
  tags: ['switch', 'form', 'boolean'],
}
