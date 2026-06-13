import type { ComponentMeta } from '@cascivo/core'

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
    '--cascivo-color-surface',
    '--cascivo-color-bg-subtle',
    '--cascivo-color-border',
    '--cascivo-color-border-strong',
    '--cascivo-color-text',
    '--cascivo-color-text-muted',
    '--cascivo-color-accent',
    '--cascivo-color-danger',
    '--cascivo-radius-input',
    '--cascivo-radius-md',
  ],
  accessibility: {
    role: 'textbox',
    wcag: '2.2-AA',
    keyboard: ['Tab'],
  },
  examples: [
    {
      title: 'Basic time picker',
      code: `<TimePicker label="Meeting time" onChange={(v) => console.log(v)} />`,
    },
  ],
  dependencies: ['@cascivo/core'],
  tags: ['time', 'input', 'form'],
  intent: {
    whenToUse: [
      'Capturing a time of day (HH:mm) in a form, such as a meeting or reminder time',
      'You want the native OS time entry UX with built-in formatting and validation',
      'A time field that needs a label, hint, error, or min/max bounds',
    ],
    whenNotToUse: [
      'Picking a calendar date — use DatePicker',
      'A free-form or non-time text value — use Input',
    ],
    antiPatterns: [
      {
        bad: '<Input placeholder="HH:mm" /> // hand-rolled time field',
        good: '<TimePicker label="Start" />',
        why: 'A plain Input cannot enforce time format or offer the native time UI; TimePicker gives parsing and locale handling for free',
      },
    ],
    related: [
      {
        name: 'DatePicker',
        relationship: 'alternative',
        reason: 'Use when a calendar date is needed instead of a time',
      },
      { name: 'Input', relationship: 'alternative', reason: 'Use for non-time free-text values' },
    ],
    a11yRationale:
      'Renders a native <input type="time"> so segmented HH/mm entry, format enforcement, and keyboard support come from the platform; error text is linked via aria-describedby with aria-invalid.',
    flexibility: [
      {
        area: 'value format',
        level: 'strict',
        note: 'Value is a 24-hour HH:mm string driven by the native time input',
      },
      {
        area: 'min/max/step',
        level: 'flexible',
        note: 'Consumer-defined bounds and step granularity',
      },
    ],
  },
}
