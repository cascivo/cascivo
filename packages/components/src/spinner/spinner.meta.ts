import type { ComponentMeta } from '@cascade-ui/core'

export const meta: ComponentMeta = {
  name: 'Spinner',
  description: 'Indeterminate loading indicator',
  category: 'feedback',
  states: [],
  variants: [],
  sizes: ['sm', 'md', 'lg'],
  props: [
    { name: 'size', type: "'sm' | 'md' | 'lg'", required: false, default: 'md' },
    {
      name: 'label',
      type: 'string',
      required: false,
      default: 'Loading',
      description: 'Accessible label announced by screen readers',
    },
  ],
  tokens: ['--cascade-radius-full'],
  accessibility: {
    role: 'status',
    wcag: 'AA',
    keyboard: [],
  },
  examples: [
    { title: 'Default', code: '<Spinner />' },
    { title: 'Large', code: '<Spinner size="lg" />' },
  ],
  dependencies: ['@cascade-ui/core', '@cascade-ui/i18n'],
  tags: ['loading', 'progress', 'feedback'],
  intent: {
    whenToUse: [
      'Indicating indeterminate work where duration and progress are unknown',
      'Loading a small region or inline control where a shape preview is unnecessary',
      'Showing busy state in buttons or compact UI',
    ],
    whenNotToUse: [
      'Progress with a known percentage — use ProgressBar or ProgressCircle',
      'Loading content with a known structure — use Skeleton',
    ],
    antiPatterns: [
      {
        bad: 'A full-page spinner for content whose layout is known',
        good: '<Skeleton> mirroring the content shape to reduce perceived wait and layout shift',
        why: 'Skeletons preview structure and feel faster; spinners are best for short, shapeless waits',
      },
    ],
    related: [
      {
        name: 'Skeleton',
        relationship: 'alternative',
        reason: 'Skeleton suits content with a known shape',
      },
      {
        name: 'ProgressBar',
        relationship: 'alternative',
        reason: 'ProgressBar suits determinate progress',
      },
    ],
    a11yRationale:
      'role="status" with an accessible label (default "Loading", i18n-driven) so assistive tech announces the busy state rather than leaving the spin silent',
    flexibility: [
      {
        area: 'size',
        level: 'flexible',
        note: 'sm/md/lg to fit inline vs standalone use',
      },
      {
        area: 'token names',
        level: 'strict',
        note: 'Radius must resolve to --cascade-radius-full',
      },
    ],
  },
}
