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
    reducedMotion: true,
    forcedColors: true,
  },
  examples: [
    { title: 'With label', code: '<Input label="Email" placeholder="you@example.com" />' },
    { title: 'With error', code: '<Input label="Email" error="Invalid email address" />' },
  ],
  dependencies: ['@cascade-ui/core'],
  tags: ['form', 'text', 'input'],
  intent: {
    whenToUse: [
      'Collecting a single line of free-form text from the user',
      'Pairing a labelled field with optional hint and validation error messaging',
      'As a field control inside a Form, wired via form.field()',
    ],
    whenNotToUse: [
      'Multi-line text — use Textarea',
      'Choosing from a fixed list of options — use Select, Combobox, or MultiSelect',
      'Editing one read-only value in place — use Editable',
    ],
    antiPatterns: [
      {
        bad: '<Input placeholder="Email" /> with no label',
        good: '<Input label="Email" placeholder="you@example.com" />',
        why: 'Placeholder text disappears on input and is not a substitute for a persistent, programmatically associated label',
      },
    ],
    related: [
      {
        name: 'Form',
        relationship: 'contained-by',
        reason: 'Input is the primary field control wired into a Form store',
      },
      {
        name: 'InputGroup',
        relationship: 'pairs-with',
        reason: 'Wrap Input in InputGroup to add prefix/suffix addons',
      },
      {
        name: 'Textarea',
        relationship: 'alternative',
        reason: 'Use Textarea for multi-line input',
      },
    ],
    a11yRationale:
      'The label is associated to the input via htmlFor/id, error text is linked through aria-describedby and announced with role="alert", and aria-invalid is set when an error is present so assistive tech reports the field as erroneous; visual focus state is driven by CSS, not tracked imperatively.',
    content: {
      tone: 'Concise noun label naming the value',
      notes:
        'Sentence case label; hint and error are full sentences; error states what is wrong and how to fix it',
    },
    flexibility: [
      {
        area: 'token names',
        level: 'strict',
        note: 'Surface, border, accent, destructive, radius, and focus-ring must resolve to the listed --cascade-* tokens',
      },
      {
        area: 'label / hint / error copy',
        level: 'flexible',
        note: 'Free, within content tone guidance',
      },
      {
        area: 'size',
        level: 'flexible',
        note: 'sm | md | lg, defaulting to md',
      },
    ],
  },
}
