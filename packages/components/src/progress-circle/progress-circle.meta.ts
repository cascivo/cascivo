import type { ComponentMeta } from '@cascade-ui/core'

export const meta: ComponentMeta = {
  name: 'ProgressCircle',
  description: 'Circular determinate progress indicator rendered as an SVG arc',
  category: 'feedback',
  states: [],
  variants: [],
  sizes: ['sm', 'md', 'lg'],
  props: [
    {
      name: 'value',
      type: 'number',
      required: true,
      description: 'Current value from 0 to max — clamped',
    },
    { name: 'max', type: 'number', required: false, default: '100' },
    { name: 'size', type: "'sm' | 'md' | 'lg'", required: false, default: 'md' },
    {
      name: 'showValue',
      type: 'boolean',
      required: false,
      default: 'false',
      description: 'Renders the rounded percentage in the center — pairs best with md and lg',
    },
    {
      name: 'label',
      type: 'string',
      required: false,
      description: 'Accessible name announced by screen readers',
    },
  ],
  tokens: ['--cascivo-color-border', '--cascivo-color-accent', '--cascivo-color-text'],
  accessibility: {
    role: 'progressbar',
    wcag: '2.2-AA',
    keyboard: [],
  },
  examples: [
    { title: 'Default', code: '<ProgressCircle value={40} label="Loading" />' },
    {
      title: 'With value',
      code: '<ProgressCircle value={72} showValue size="lg" label="Upload progress" />',
    },
    { title: 'Custom max', code: '<ProgressCircle value={3} max={8} label="Steps completed" />' },
  ],
  dependencies: ['@cascade-ui/core'],
  tags: ['progress', 'loading', 'circle', 'feedback'],
  intent: {
    whenToUse: [
      'Showing determinate progress compactly as a circular arc',
      'Displaying a percentage in a small footprint (showValue)',
      'Tracking completion against a custom maximum (max)',
    ],
    whenNotToUse: [
      'Indeterminate work with no known value — use Spinner',
      'Full-width linear progress with a label and helper text — use ProgressBar',
      'Multi-step flows — use ProgressIndicator',
    ],
    antiPatterns: [
      {
        bad: 'Using ProgressCircle for indeterminate loading',
        good: '<Spinner> for indeterminate states',
        why: 'ProgressCircle requires a determinate value; it cannot express unknown progress',
      },
    ],
    related: [
      {
        name: 'ProgressBar',
        relationship: 'alternative',
        reason: 'Linear form with labels and indeterminate support',
      },
      {
        name: 'Spinner',
        relationship: 'alternative',
        reason: 'Indeterminate alternative when value is unknown',
      },
    ],
    a11yRationale:
      'role="progressbar" with value/max conveys completion to assistive tech; the label prop supplies an accessible name since the SVG arc alone carries no text',
    flexibility: [
      {
        area: 'size and showValue',
        level: 'flexible',
        note: 'showValue pairs best with md/lg sizes',
      },
      {
        area: 'token names',
        level: 'strict',
        note: 'Arc and track colors must resolve to --cascivo-* tokens',
      },
    ],
  },
}
