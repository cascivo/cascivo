import type { ComponentMeta } from '@cascivo/core'

export const meta: ComponentMeta = {
  name: 'OtpInput',
  description: 'Segmented one-time code input',
  category: 'inputs',
  states: ['idle', 'focused', 'filled', 'disabled'],
  variants: [],
  sizes: [],
  props: [
    {
      name: 'length',
      description: 'Number of input cells.',
      type: 'number',
      required: false,
      default: '6',
    },
    { name: 'value', description: 'The controlled value.', type: 'string', required: true },
    {
      name: 'onValueChange',
      description: 'Called with the new value when it changes.',
      type: '(v: string) => void',
      required: true,
    },
    {
      name: 'disabled',
      description: 'When true, disables the control and removes it from the tab order.',
      type: 'boolean',
      required: false,
      default: 'false',
    },
    {
      name: 'type',
      description: "Accepted characters ('numeric' | 'alphanumeric').",
      type: "'numeric' | 'alphanumeric'",
      required: false,
      default: 'numeric',
    },
  ],
  tokens: [
    '--cascivo-color-surface',
    '--cascivo-color-border',
    '--cascivo-color-accent',
    '--cascivo-color-bg-subtle',
    '--cascivo-radius-input',
    '--cascivo-focus-ring',
  ],
  accessibility: {
    role: 'group',
    wcag: '2.2-AA',
    keyboard: ['ArrowLeft', 'ArrowRight', 'Backspace'],
  },
  examples: [
    { title: 'Basic', code: '<OtpInput value="" onValueChange={() => {}} />' },
    { title: '4-digit', code: '<OtpInput length={4} value="" onValueChange={() => {}} />' },
  ],
  dependencies: ['@cascivo/core', '@cascivo/i18n'],
  tags: ['form', 'otp', 'code', 'input', 'verification'],
  intent: {
    whenToUse: [
      'Entering a fixed-length one-time code (2FA, SMS verification, email confirmation) split across per-character slots',
      'Codes that benefit from auto-advance between slots and pasting the full code at once',
      'Numeric or alphanumeric short codes of a known length',
    ],
    whenNotToUse: [
      'Variable-length or free-form text — use Input',
      'Secret credentials that should be masked — use PasswordInput',
      'Long codes where per-character boxes add no value over a single field — use Input',
    ],
    antiPatterns: [
      {
        bad: '<Input maxLength={6} placeholder="Enter code" />',
        good: '<OtpInput length={6} value={code} onValueChange={setCode} />',
        why: 'OtpInput gives per-digit slots with auto-advance, backspace-to-previous, full-code paste handling, and autoComplete="one-time-code" that a single Input does not',
      },
    ],
    related: [
      {
        name: 'Input',
        relationship: 'alternative',
        reason: 'Use for variable-length or non-code text entry',
      },
      {
        name: 'PasswordInput',
        relationship: 'alternative',
        reason: 'Use when the entered value is a secret that must be masked',
      },
    ],
    a11yRationale:
      'Wraps the slots in role="group" with a localized aria-label and labels each slot with its position so screen readers announce which digit is being entered; the first slot carries autoComplete="one-time-code" so platform SMS autofill can populate the code.',
    flexibility: [
      {
        area: 'token names',
        level: 'strict',
        note: 'Slot styling must resolve to the listed --cascivo-* tokens',
      },
      {
        area: 'length and type',
        level: 'flexible',
        note: 'length and numeric/alphanumeric type are free to match the issued code format',
      },
    ],
  },
}
