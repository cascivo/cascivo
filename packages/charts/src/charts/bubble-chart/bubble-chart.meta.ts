import type { ComponentMeta } from '@cascade-ui/core'

export const meta: ComponentMeta = {
  name: 'BubbleChart',
  description:
    'Bubble chart mapping x, y, and size dimensions; radius is area-proportional via sqrt scale.',
  category: 'chart',
  states: [],
  variants: [],
  sizes: [],
  props: [
    {
      name: 'series',
      type: '{ name: string; data: { x: number; y: number; size: number }[] }[]',
      required: true,
    },
    { name: 'title', type: 'string', required: true },
    { name: 'description', type: 'string', required: false },
    { name: 'width', type: 'number', required: false },
    { name: 'height', type: 'number', required: false, default: '320' },
    {
      name: 'tooltip',
      type: 'boolean',
      required: false,
      description: 'Enable hover/keyboard tooltip',
    },
    { name: 'className', type: 'string', required: false },
    {
      name: 'plain',
      type: 'boolean',
      required: false,
      default: 'false',
      description: 'Marks only — no axes, grid lines, or legend. For micro/inline charts.',
    },
  ],
  tokens: [
    '--cascade-chart-1',
    '--cascade-chart-2',
    '--cascade-chart-3',
    '--cascade-chart-4',
    '--cascade-chart-5',
    '--cascade-chart-6',
    '--cascade-chart-7',
    '--cascade-chart-8',
  ],
  accessibility: {
    role: 'img',
    wcag: 'AA',
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
      code: `import { BubbleChart } from '@cascade-ui/charts'

const series = [{ name: 'Group A', data: [{x:1,y:2,size:10},{x:3,y:4,size:30}] }]
<BubbleChart series={series} title="Bubble" />`,
    },
  ],
  dependencies: ['@cascade-ui/charts'],
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
