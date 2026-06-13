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
  intent: {
    whenToUse: [
      'Showing progress through the discrete steps of a multi-step flow (wizard, checkout)',
      'Communicating which step is complete, current, and upcoming',
      'Laying out steps horizontally or vertically with optional descriptions',
    ],
    whenNotToUse: [
      'Continuous task progress with a percentage — use ProgressBar or ProgressCircle',
      'Indeterminate loading — use Spinner',
    ],
    antiPatterns: [
      {
        bad: 'Using ProgressIndicator to show a download percentage',
        good: '<ProgressBar value={pct}> for continuous progress',
        why: 'ProgressIndicator models discrete steps, not a continuous quantity',
      },
    ],
    related: [
      {
        name: 'ProgressBar',
        relationship: 'alternative',
        reason: 'ProgressBar shows continuous progress; this shows discrete steps',
      },
    ],
    a11yRationale:
      'role="list" structures the steps in order; the current step is conveyed as text/state rather than color alone, so screen-reader users know where they are in the flow',
    content: {
      tone: 'Short step labels; descriptions add detail',
      notes: 'Order matters — steps are read sequentially',
    },
    flexibility: [
      {
        area: 'orientation',
        level: 'flexible',
        note: 'horizontal or vertical to fit the layout',
      },
      {
        area: 'token names',
        level: 'strict',
        note: 'Step and connector colors must resolve to --cascade-* tokens',
      },
    ],
  },
}
