import type { ComponentMeta } from '@cascade-ui/core'

export const meta: ComponentMeta = {
  name: 'ProgressIndicator',
  description: 'Shows progress through the steps of a multi-step flow',
  category: 'navigation',
  states: ['complete', 'current', 'incomplete'],
  variants: ['horizontal', 'vertical'],
  sizes: [],
  props: [
    {
      name: 'steps',
      type: '{ label: string; description?: string }[]',
      required: true,
      description: 'Ordered list of steps',
    },
    {
      name: 'currentIndex',
      type: 'number',
      required: true,
      description: 'Index of the current step (0-based)',
    },
    { name: 'vertical', type: 'boolean', required: false, default: 'false' },
    { name: 'className', type: 'string', required: false },
  ],
  tokens: [
    '--cascade-color-accent',
    '--cascade-color-accent-subtle',
    '--cascade-color-text',
    '--cascade-color-text-muted',
    '--cascade-color-text-subtle',
    '--cascade-color-text-on-accent',
    '--cascade-color-border',
    '--cascade-color-surface',
    '--cascade-radius-full',
  ],
  accessibility: {
    role: 'list',
    wcag: 'AA',
    keyboard: [],
  },
  examples: [
    {
      title: 'Horizontal',
      code: "<ProgressIndicator steps={[{ label: 'Cart' }, { label: 'Shipping' }, { label: 'Payment' }]} currentIndex={1} />",
    },
    {
      title: 'Vertical with descriptions',
      code: "<ProgressIndicator vertical steps={[{ label: 'Account', description: 'Your details' }, { label: 'Confirm' }]} currentIndex={0} />",
    },
  ],
  dependencies: ['@cascade-ui/core'],
  tags: ['steps', 'wizard', 'stepper', 'progress', 'navigation'],
}
