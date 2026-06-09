import type { ComponentMeta } from '@cascade-ui/core'

export const meta: ComponentMeta = {
  name: 'Radio',
  description: 'Single choice from a set, grouped with RadioGroup',
  category: 'inputs',
  states: ['unchecked', 'checked'],
  variants: [],
  sizes: [],
  props: [
    { name: 'label', type: 'string', required: false },
    { name: 'value', type: 'string', required: true },
    { name: 'disabled', type: 'boolean', required: false, default: 'false' },
    { name: 'name', type: 'string', required: false },
  ],
  tokens: [
    '--cascade-color-surface',
    '--cascade-color-accent',
    '--cascade-color-border-strong',
    '--cascade-color-text-on-accent',
    '--cascade-radius-full',
    '--cascade-focus-ring',
  ],
  accessibility: {
    role: 'radio',
    wcag: 'AA',
    keyboard: ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'],
  },
  examples: [
    {
      title: 'Group',
      code: '<RadioGroup name="plan" defaultValue="pro"><Radio value="pro" label="Pro" /><Radio value="team" label="Team" /></RadioGroup>',
    },
  ],
  dependencies: ['@cascade-ui/core'],
  tags: ['form', 'choice', 'group'],
}
