import type { ComponentMeta } from '@cascade-ui/core'

export const meta: ComponentMeta = {
  name: 'ProgressBar',
  description: 'Shows determinate or indeterminate progress of a task',
  category: 'feedback',
  states: ['determinate', 'indeterminate'],
  variants: ['active', 'success', 'error'],
  sizes: ['sm', 'md'],
  props: [
    {
      name: 'value',
      type: 'number',
      required: false,
      description: 'Current value from 0 to max; omit for an indeterminate bar',
    },
    { name: 'max', type: 'number', required: false, default: '100' },
    {
      name: 'label',
      type: 'string',
      required: false,
      description: 'Visible label above the track, wired via aria-labelledby',
    },
    { name: 'helperText', type: 'string', required: false },
    { name: 'size', type: "'sm' | 'md'", required: false, default: 'md' },
    {
      name: 'status',
      type: "'active' | 'success' | 'error'",
      required: false,
      default: 'active',
      description: 'success/error tint the fill and show a glyph next to the label',
    },
  ],
  tokens: [
    '--cascade-color-accent',
    '--cascade-color-success',
    '--cascade-color-destructive',
    '--cascade-color-border',
    '--cascade-color-text',
    '--cascade-color-text-subtle',
    '--cascade-radius-full',
    '--cascade-motion-enter',
  ],
  accessibility: { role: 'progressbar', wcag: 'AA', keyboard: [] },
  examples: [
    { title: 'Determinate', code: '<ProgressBar value={60} label="Uploading" />' },
    { title: 'Indeterminate', code: '<ProgressBar label="Processing" />' },
    {
      title: 'Success',
      code: '<ProgressBar value={100} status="success" label="Upload complete" />',
    },
  ],
  dependencies: ['@cascade-ui/core'],
  tags: ['progress', 'loading', 'status', 'feedback'],
  intent: {
    whenToUse: [
      'Showing linear determinate progress of a task with a known percentage (value)',
      'Indicating ongoing work of unknown duration (omit value for indeterminate)',
      'Reflecting success/error outcome of a tracked operation (status)',
    ],
    whenNotToUse: [
      'A compact circular indicator is preferred — use ProgressCircle',
      'Pure indeterminate spinning with no track — use Spinner',
      'Stepping through a multi-step flow — use ProgressIndicator',
    ],
    antiPatterns: [
      {
        bad: 'A determinate ProgressBar with a faked, jumping value',
        good: 'Omit value for an indeterminate bar when real progress is unknown',
        why: 'A determinate bar implies a meaningful percentage; faking it misleads the user',
      },
    ],
    related: [
      {
        name: 'ProgressCircle',
        relationship: 'alternative',
        reason: 'Circular form for compact determinate progress',
      },
      {
        name: 'Spinner',
        relationship: 'alternative',
        reason: 'Spinner for indeterminate work with no track',
      },
    ],
    a11yRationale:
      'role="progressbar" with value/max exposes completion to assistive tech; the label is wired via aria-labelledby and success/error states add a glyph so outcome is not color-only',
    flexibility: [
      {
        area: 'determinate vs indeterminate',
        level: 'flexible',
        note: 'Presence of value selects the mode',
      },
      {
        area: 'token names',
        level: 'strict',
        note: 'Fill and status colors must resolve to --cascade-* tokens',
      },
    ],
  },
}
