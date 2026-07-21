import type { ComponentMeta } from '@cascivo/core'

export const meta: ComponentMeta = {
  name: 'Toggle',
  description: 'On/off switch built as an accessible button',
  category: 'inputs',
  states: ['off', 'on'],
  variants: [],
  sizes: ['sm', 'md'],
  props: [
    {
      name: 'checked',
      description: 'Whether the control is checked (controlled).',
      type: 'boolean',
      required: false,
    },
    {
      name: 'defaultChecked',
      description: 'Whether the control is checked on first render (uncontrolled).',
      type: 'boolean',
      required: false,
      default: 'false',
    },
    {
      name: 'onValueChange',
      description: 'Called with the new checked state when the switch is toggled.',
      type: '(checked: boolean) => void',
      required: false,
    },
    {
      name: 'onChange',
      description: 'Deprecated: use onValueChange (same checked boolean).',
      type: '(checked: boolean) => void',
      required: false,
    },
    {
      name: 'label',
      description:
        'Visible text label beside the switch; it also becomes the accessible name. When a heading already labels the control, omit this and pass aria-label instead to avoid duplicated text.',
      type: 'string',
      required: false,
    },
    {
      name: 'size',
      description: "Visual size of the component (e.g. 'sm', 'md', 'lg').",
      type: "'sm' | 'md'",
      required: false,
      default: 'md',
    },
    {
      name: 'disabled',
      description: 'When true, disables the control and removes it from the tab order.',
      type: 'boolean',
      required: false,
      default: 'false',
    },
  ],
  tokens: [
    '--cascivo-color-accent',
    '--cascivo-color-border-strong',
    '--cascivo-color-surface',
    '--cascivo-radius-full',
    '--cascivo-focus-ring',
  ],
  accessibility: {
    role: 'switch',
    wcag: '2.2-AA',
    keyboard: ['Space', 'Enter'],
    apgPattern: 'switch',
    reducedMotion: true,
    forcedColors: true,
  },
  examples: [
    { title: 'Uncontrolled', code: '<Toggle label="Notifications" defaultChecked />' },
    {
      title: 'Controlled',
      code: '<Toggle checked={enabled} onValueChange={setEnabled} label="Dark mode" />',
    },
  ],
  dependencies: ['@cascivo/core'],
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
      {
        bad: '<h3>Dark mode</h3><Toggle label="Dark mode" /> — the label repeats the heading',
        good: '<h3>Dark mode</h3><Toggle aria-label="Dark mode" />',
        why: 'The `label` prop renders visible text and is the accessible name; when a heading already names the control, use aria-label so the name is not shown (and read) twice',
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
        note: 'Track and thumb colors must resolve to --cascivo-color-* / radius / focus-ring tokens',
      },
      {
        area: 'label copy',
        level: 'flexible',
        note: 'Optional label describing the setting being toggled',
      },
    ],
  },
}
