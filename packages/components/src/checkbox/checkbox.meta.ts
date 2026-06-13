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
    apgPattern: 'checkbox',
    reducedMotion: true,
    forcedColors: true,
  },
  examples: [
    { title: 'With label', code: '<Checkbox label="Accept terms" />' },
    { title: 'Indeterminate', code: '<Checkbox label="Select all" indeterminate />' },
  ],
  dependencies: ['@cascade-ui/core'],
  tags: ['form', 'toggle', 'boolean'],
  intent: {
    whenToUse: [
      'Selecting zero or more options from a list where each choice is independent',
      'A single opt-in within a form (accept terms, subscribe) submitted alongside other fields',
      'A "select all" control that needs an indeterminate (partial) state',
    ],
    whenNotToUse: [
      'A binary setting that applies immediately on change — use Toggle',
      'Choosing exactly one option from a mutually exclusive set — use Radio',
    ],
    antiPatterns: [
      {
        bad: '<Checkbox label="Dark mode" /> that flips a setting live',
        good: '<Toggle label="Dark mode" />',
        why: 'Checkbox signals a form value to be submitted; Toggle signals an immediate on/off state change',
      },
      {
        bad: 'Two checkboxes for one either/or choice',
        good: 'Use Radio for mutually exclusive options',
        why: 'Independent checkboxes let the user select both or neither, which a single exclusive choice should not allow',
      },
    ],
    related: [
      {
        name: 'Toggle',
        relationship: 'alternative',
        reason: 'Use for immediate binary settings rather than form values',
      },
      {
        name: 'Radio',
        relationship: 'alternative',
        reason: 'Use for selecting exactly one from a mutually exclusive set',
      },
      {
        name: 'CheckboxCard',
        relationship: 'alternative',
        reason: 'Use the card variant when each option needs a title plus description',
      },
    ],
    a11yRationale:
      'Renders a native <input type="checkbox"> wrapped in a <label>, so role, checked/indeterminate state, Space activation, and label association come from the platform; the indeterminate visual is set on the DOM node since it is a property not an attribute',
    flexibility: [
      {
        area: 'native input props',
        level: 'flexible',
        note: 'Spreads InputHTMLAttributes — name, value, required, checked, onChange all pass through',
      },
      {
        area: 'token names',
        level: 'strict',
        note: 'Control styling resolves to semantic --cascade-color-* / --cascade-radius-sm tokens',
      },
    ],
  },
}
