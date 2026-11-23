import type { ComponentMeta } from '@cascivo/core'

export const meta: ComponentMeta = {
  name: 'ProgressBar',
  description: 'Shows determinate or indeterminate progress of a task',
  category: 'feedback',
  clientJs: 'none',
  contractTier: 'static',
  anatomy: {
    root: {
      local: 'progress',
      element: 'div',
      data: {
        'data-status': ['active', 'success', 'error'],
        'data-size': ['sm', 'md'],
        'data-state': ['indeterminate'],
      },
      children: ['label', 'track', 'helper'],
      // The label id, percentage and glyph are computed from the props.
      emit: 'manual',
    },
    parts: {
      label: { element: 'span', children: ['$text', 'glyph'], when: 'label' },
      glyph: { element: 'span', aria: ['aria-hidden'], children: ['$text'], when: 'status' },
      track: {
        element: 'div',
        role: 'progressbar',
        aria: ['aria-valuemin', 'aria-valuemax', 'aria-valuenow', 'aria-labelledby'],
        children: ['fill'],
      },
      fill: { element: 'div' },
      helper: { element: 'span', children: ['$text'], when: 'helperText' },
    },
  },
  states: ['indeterminate'],
  variants: ['active', 'success', 'error'],
  sizes: ['sm', 'md'],
  props: [
    {
      name: 'value',
      type: 'number',
      required: false,
      description: 'Current value from 0 to max; omit for an indeterminate bar',
    },
    {
      name: 'max',
      description: 'Maximum allowed value.',
      type: 'number',
      required: false,
      default: '100',
    },
    {
      name: 'label',
      nameVisibility: 'visible',
      type: 'string',
      required: false,
      description: 'Visible label above the track, wired via aria-labelledby',
    },
    {
      name: 'helperText',
      description: 'Supplementary text shown with the progress bar.',
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
      name: 'status',
      type: "'active' | 'success' | 'error'",
      required: false,
      default: 'active',
      description: 'success/error tint the fill and show a glyph next to the label',
    },
  ],
  tokens: [
    '--cascivo-color-accent',
    '--cascivo-color-success',
    '--cascivo-color-destructive',
    '--cascivo-color-border',
    '--cascivo-color-text',
    '--cascivo-color-text-subtle',
    '--cascivo-radius-full',
    '--cascivo-motion-enter',
  ],
  accessibility: { role: 'progressbar', wcag: '2.2-AA', keyboard: [] },
  examples: [
    { title: 'Determinate', code: '<ProgressBar value={60} label="Uploading" />' },
    { title: 'Indeterminate', code: '<ProgressBar label="Processing" />' },
    {
      title: 'Success',
      code: '<ProgressBar value={100} status="success" label="Upload complete" />',
    },
  ],
  dependencies: ['@cascivo/core'],
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
        note: 'Fill and status colors must resolve to --cascivo-* tokens',
      },
    ],
  },
}
