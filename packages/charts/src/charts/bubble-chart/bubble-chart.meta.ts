import type { ComponentMeta } from '@cascivo/core'

export const meta: ComponentMeta = {
  name: 'BubbleChart',
  description:
    'Bubble chart mapping x, y, and size dimensions; radius is area-proportional via sqrt scale.',
  category: 'chart',
  // Server HTML carries the SVG plus the accessible data <table> with the real values, so the
  // chart reads with JS off; JS adds hover, tooltips and transitions.
  clientJs: 'enhancement',
  states: [],
  variants: [],
  sizes: [],
  props: [
    {
      name: 'series',
      description: 'The data series to plot.',
      type: '{ name: string; data: { x: number; y: number; size: number }[] }[]',
      required: true,
    },
    { name: 'title', description: 'Title text for the component.', type: 'string', required: true },
    {
      name: 'description',
      description: 'Supporting description text.',
      type: 'string',
      required: false,
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
      default: '320',
    },
    {
      name: 'tooltip',
      type: 'boolean',
      required: false,
      description: 'Enable hover/keyboard tooltip',
    },
    {
      name: 'className',
      description: 'Additional CSS class names merged onto the root element.',
      type: 'string',
      required: false,
    },
    {
      name: 'plain',
      type: 'boolean',
      required: false,
      default: 'false',
      description: 'Marks only — no axes, grid lines, or legend. For micro/inline charts.',
    },
    {
      name: 'glyph',
      type: 'GlyphShape | ((d, seriesId) => GlyphShape)',
      required: false,
      description:
        'Point glyph shape (circle/square/diamond/triangle/cross/star) — a fixed shape or a function to encode a category by shape.',
    },
    {
      name: 'format',
      type: '(value: number | string | Date) => string',
      required: false,
      description: 'Format each X-axis tick label.',
    },
  ],
  typeDefs: [
    {
      name: 'BubbleSeries',
      description: 'Shape of the `series` prop.',
      fields: [
        {
          name: 'name',
          type: 'string',
          required: true,
        },
        {
          name: 'data',
          type: 'BubbleDatum[]',
          required: true,
        },
      ],
    },
  ],
  tokens: [
    '--cascivo-chart-1',
    '--cascivo-chart-2',
    '--cascivo-chart-3',
    '--cascivo-chart-4',
    '--cascivo-chart-5',
    '--cascivo-chart-6',
    '--cascivo-chart-7',
    '--cascivo-chart-8',
  ],
  accessibility: {
    role: 'img',
    wcag: '2.1-AA',
    keyboard: [
      'Tab (focus chart)',
      'ArrowLeft/ArrowRight (navigate points)',
      'Home/End (first/last point)',
      'Escape (clear focus)',
    ],
  },
  examples: [
    {
      title: 'Basic bubble chart',
      code: `import { BubbleChart } from '@cascivo/charts'

const series = [{ name: 'Group A', data: [{x:1,y:2,size:10},{x:3,y:4,size:30}] }]
<BubbleChart series={series} title="Bubble" />`,
    },
  ],
  dependencies: ['@cascivo/charts'],
  tags: ['chart', 'bubble', 'scatter', 'three-dimensional', 'data-viz'],
  intent: {
    whenToUse: [
      'Plotting three dimensions at once — x, y, and a size-encoded magnitude',
      'Comparing entities where relative scale matters alongside position',
    ],
    whenNotToUse: [
      'Showing only a 2D correlation — use ScatterChart',
      'Comparing many small magnitudes where size differences are unreadable',
    ],
    antiPatterns: [],
    related: [
      {
        name: 'ScatterChart',
        relationship: 'alternative',
        reason: 'Use when there is no third size dimension to encode',
      },
    ],
    a11yRationale: 'Renders with role="img" and requires a title prop for screen reader labeling.',
    flexibility: [],
  },
}
