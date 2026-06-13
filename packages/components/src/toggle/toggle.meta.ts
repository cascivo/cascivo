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
  intent: {
    whenToUse: [
      'Flipping a single binary setting that takes effect immediately (e.g. notifications on/off)',
      'On/off state where a physical switch metaphor reads better than a checkmark',
      'Settings screens where the change applies live without a separate submit',
    ],
    whenNotToUse: [
      'Selecting items in a form that is submitted later — use Checkbox',
      'Choosing one option among several mutually exclusive labels — use SegmentedControl or Radio',
    ],
    antiPatterns: [
      {
        bad: '<Toggle label="I accept the terms" /> inside a submitted form',
        good: '<Checkbox label="I accept the terms" />',
        why: 'A switch implies an instant on/off setting; agreement that is submitted with the form is a checkbox',
      },
    ],
    related: [
      {
        name: 'Checkbox',
        relationship: 'alternative',
        reason: 'Use for form selections submitted later rather than instant settings',
      },
      {
        name: 'SegmentedControl',
        relationship: 'alternative',
        reason: 'Use when choosing among several exclusive options, not just on/off',
      },
    ],
    a11yRationale:
      'Renders a <button role="switch"> with aria-checked reflecting state, so assistive tech announces it as a switch and Space/Enter toggle it via native button activation.',
    flexibility: [
      {
        area: 'token names',
        level: 'strict',
        note: 'Track and thumb colors must resolve to --cascade-color-* / radius / focus-ring tokens',
      },
      {
        area: 'label copy',
        level: 'flexible',
        note: 'Optional label describing the setting being toggled',
      },
    ],
  },
}
