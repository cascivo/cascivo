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
  tokens: ['--cascade-color-border', '--cascade-color-accent', '--cascade-color-text'],
  accessibility: {
    role: 'progressbar',
    wcag: 'AA',
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
}
