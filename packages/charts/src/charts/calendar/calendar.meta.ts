import type { ComponentMeta } from '@cascivo/core'

export const meta: ComponentMeta = {
  name: 'Calendar',
  description:
    'Calendar heatmap — a week-column grid of day cells colored by value (GitHub-style).',
  category: 'chart',
  states: [],
  variants: [],
  sizes: [],
  props: [
    {
      name: 'data',
      type: 'CalendarDatum[]',
      required: true,
      description: 'Days: { day: string | Date, value }.',
    },
    { name: 'title', type: 'string', required: true },
    { name: 'description', type: 'string', required: false },
    {
      name: 'from',
      type: 'string | Date',
      required: false,
      description: 'Range start (defaults to min day).',
    },
    {
      name: 'to',
      type: 'string | Date',
      required: false,
      description: 'Range end (defaults to max day).',
    },
    { name: 'width', type: 'number', required: false },
    { name: 'height', type: 'number', required: false, default: '160' },
    { name: 'tooltip', type: 'boolean', required: false },
    { name: 'className', type: 'string', required: false },
    { name: 'plain', type: 'boolean', required: false, default: 'false' },
  ],
  tokens: ['--cascivo-chart-2'],
  accessibility: {
    role: 'img',
    wcag: '2.1-AA',
    keyboard: ['Tab (focus chart)', 'ArrowLeft/ArrowRight (navigate days)', 'Escape (clear focus)'],
  },
  examples: [
    {
      title: 'Contribution calendar',
      code: `import { Calendar } from '@cascivo/charts'

<Calendar
  title="Activity"
  data={[{ day: '2026-01-01', value: 3 }, { day: '2026-01-02', value: 7 }]}
/>`,
    },
  ],
  dependencies: ['@cascivo/charts'],
  tags: ['chart', 'calendar', 'heatmap', 'time', 'data-viz'],
  intent: {
    whenToUse: [
      'Showing a daily value over weeks/months (activity, contributions)',
      'Spotting weekly/seasonal patterns at a glance',
    ],
    whenNotToUse: ['Precise daily values — use a LineChart', 'Non-date categories — use Heatmap'],
    antiPatterns: [],
    related: [
      {
        name: 'Heatmap',
        relationship: 'alternative',
        reason: 'Use for arbitrary x/y category grids',
      },
    ],
    a11yRationale: 'Renders role="img" with a title and a fallback day/value table.',
    flexibility: [],
  },
}
