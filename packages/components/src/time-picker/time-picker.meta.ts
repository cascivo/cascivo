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
    {
      name: 'defaultValue',
      description: 'The initial value when uncontrolled.',
      type: 'string',
      required: false,
    },
    {
      name: 'onChange',
      description: 'Called when the value changes.',
      type: '(value: string) => void',
      required: false,
    },
    { name: 'min', description: 'Minimum allowed value.', type: 'string', required: false },
    { name: 'max', description: 'Maximum allowed value.', type: 'string', required: false },
    {
      name: 'step',
      description: 'Increment between allowed values.',
      type: 'number',
      required: false,
    },
    { name: 'label', description: 'Text label for the control.', type: 'string', required: false },
    {
      name: 'hint',
      description: 'Supplementary hint text shown with the control.',
      type: 'string',
      required: false,
    },
    {
      name: 'error',
      description: 'Error message shown when the value is invalid.',
      type: 'string',
      required: false,
    },
    {
      name: 'size',
      description: "Visual size of the component (e.g. 'sm', 'md', 'lg').",
      type: "'sm' | 'md' | 'lg'",
      required: false,
      default: "'md'",
    },
    {
      name: 'disabled',
      description: 'When true, disables the control and removes it from the tab order.',
      type: 'boolean',
      required: false,
    },
    {
      name: 'className',
      description: 'Additional CSS class names merged onto the root element.',
      type: 'string',
      required: false,
    },
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
