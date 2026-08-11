import type { ComponentMeta } from '@cascivo/core'

export const meta: ComponentMeta = {
  name: 'CalendarHeatmap',
  description:
    'Calendar heatmap — a week-column grid of day cells colored by value (GitHub-style).',
  category: 'chart',
  states: [],
  variants: [],
  sizes: [],
  props: [
    {
      name: 'data',
      type: 'CalendarHeatmapDatum[]',
      required: true,
      description: 'Days: { day: string | Date, value }.',
    },
    { name: 'title', description: 'Title text for the component.', type: 'string', required: true },
    {
      name: 'description',
      description: 'Supporting description text.',
      type: 'string',
      required: false,
    },
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
    {
      name: 'width',
      description:
        'Fixed SVG width in px. ⚠ **Omit for a responsive chart** — the chart fills and tracks its container via a ResizeObserver; there is no correct pixel number in a responsive grid. A fixed width is clamped to the container (max-inline-size: 100%) so it can never overflow its card, but it also stops the chart growing. `useChartSize` is NOT needed for this — charts call it internally.',
      type: 'number',
      required: false,
    },
    {
      name: 'height',
      description:
        "SVG height in px. Unlike `width`, height does NOT track the container — this is the knob you set to change the chart's aspect.",
      type: 'number',
      required: false,
      default: '160',
    },
    {
      name: 'tooltip',
      description: 'Whether to show tooltips on hover.',
      type: 'boolean',
      required: false,
    },
    {
      name: 'className',
      description: 'Additional CSS class names merged onto the root element.',
      type: 'string',
      required: false,
    },
    {
      name: 'plain',
      description: 'When true, renders a minimal variant without chart chrome.',
      type: 'boolean',
      required: false,
      default: 'false',
    },
    {
      name: 'visualMap',
      type: 'VisualMapOptions',
      required: false,
      description:
        'Map day value → CVD-safe colour (continuous or piecewise) via a keyboard-operable legend that filters the visible range.',
    },
  ],
  typeDefs: [
    {
      name: 'CalendarHeatmapDatum',
      description: 'Shape of the `data` prop.',
      fields: [
        {
          name: 'day',
          type: 'string | Date',
          required: true,
        },
        {
          name: 'value',
          type: 'number',
          required: true,
        },
      ],
    },
    {
      name: 'VisualMapOptions',
      description: 'Shape of the `visualMap` prop.',
      fields: [
        {
          name: 'min',
          type: 'number',
          required: true,
          description: 'Domain minimum (value mapped to ramp t=0).',
        },
        {
          name: 'max',
          type: 'number',
          required: true,
          description: 'Domain maximum (value mapped to ramp t=1).',
        },
        {
          name: 'mode',
          type: 'VisualMode',
          required: false,
          description: '`continuous` ramp (default) or `piecewise` buckets.',
        },
        {
          name: 'channel',
          type: 'VisualChannel',
          required: false,
          description: 'Which visual channel(s) the value drives.',
        },
        {
          name: 'ramp',
          type: 'RampKind',
          required: false,
          description: 'Ramp family — CVD-safe `sequential` (default) or `diverging`.',
        },
        {
          name: 'pieces',
          type: 'number',
          required: false,
          description: 'Bucket count for `piecewise` (default 5).',
        },
        {
          name: 'sizeRange',
          type: '[number, number]',
          required: false,
          description: '[min, max] mark radius in px for the `size` channel (default [3, 14]).',
        },
      ],
    },
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
      code: `import { CalendarHeatmap } from '@cascivo/charts'

<CalendarHeatmap
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
