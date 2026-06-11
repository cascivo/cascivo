import type { ComponentMeta } from '@cascade-ui/core'

export const meta: ComponentMeta = {
  name: 'PasswordInput',
  description: 'Password input with reveal toggle and optional strength meter',
  category: 'inputs',
  states: ['idle', 'revealed'],
  variants: [],
  sizes: ['sm', 'md', 'lg'],
  props: [
    { name: 'showStrengthMeter', type: 'boolean', required: false, default: 'false' },
    { name: 'size', type: "'sm' | 'md' | 'lg'", required: false, default: 'md' },
    { name: 'labels', type: 'PasswordInputLabels', required: false },
    { name: 'disabled', type: 'boolean', required: false, default: 'false' },
    { name: 'placeholder', type: 'string', required: false },
    { name: 'value', type: 'string', required: false },
    { name: 'onChange', type: '(e: React.ChangeEvent<HTMLInputElement>) => void', required: false },
  ],
  tokens: [
    '--cascade-color-surface',
    '--cascade-color-border',
    '--cascade-color-accent',
    '--cascade-color-destructive',
    '--cascade-color-warning',
    '--cascade-color-success',
    '--cascade-radius-input',
    '--cascade-focus-ring',
  ],
  accessibility: {
    role: 'textbox',
    wcag: 'AA',
    keyboard: ['Tab', 'Shift+Tab'],
  },
  examples: [
    { title: 'Basic', code: '<PasswordInput placeholder="Enter password" />' },
    {
      title: 'With strength meter',
      code: '<PasswordInput showStrengthMeter placeholder="Create password" />',
    },
  ],
  dependencies: ['@cascade-ui/core', '@cascade-ui/i18n'],
  tags: ['form', 'password', 'input', 'security'],
}
