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
    '--cascivo-color-surface',
    '--cascivo-color-border',
    '--cascivo-color-accent',
    '--cascivo-color-destructive',
    '--cascivo-color-warning',
    '--cascivo-color-success',
    '--cascivo-radius-input',
    '--cascivo-focus-ring',
  ],
  accessibility: {
    role: 'textbox',
    wcag: '2.2-AA',
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
  intent: {
    whenToUse: [
      'Collecting a secret credential that should be masked by default with an opt-in reveal toggle',
      'Password creation flows that benefit from inline strength feedback',
    ],
    whenNotToUse: [
      'Non-secret text — use Input',
      'A fixed-length one-time verification code — use OtpInput',
    ],
    antiPatterns: [
      {
        bad: '<Input type="password" />',
        good: '<PasswordInput showStrengthMeter />',
        why: 'PasswordInput adds an accessible reveal/hide toggle and an optional strength meter on top of the masked field, which a raw password input lacks',
      },
    ],
    related: [
      {
        name: 'Input',
        relationship: 'alternative',
        reason: 'Use for non-secret text that never needs masking',
      },
      {
        name: 'OtpInput',
        relationship: 'alternative',
        reason: 'Use for fixed-length one-time codes rather than passwords',
      },
    ],
    a11yRationale:
      'The reveal control is a real <button> whose aria-label switches between reveal/hide so screen-reader users know the current masking state; toggling swaps the input type between password and text so the platform handles masking natively.',
    content: {
      tone: 'Concise control labels',
      notes:
        'reveal/hide and strength labels default from the i18n catalog; override via labels for custom copy or locale',
    },
    flexibility: [
      {
        area: 'token names',
        level: 'strict',
        note: 'Field, toggle, and strength-meter styling must resolve to the listed --cascivo-* tokens',
      },
      {
        area: 'labels',
        level: 'flexible',
        note: 'reveal, hide, and strengthLabel can be overridden via the labels prop',
      },
    ],
  },
}
