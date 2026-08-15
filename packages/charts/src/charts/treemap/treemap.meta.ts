import type { ComponentMeta } from '@cascivo/core'

export const meta: ComponentMeta = {
  name: 'Treemap',
  description: 'Squarified treemap for visualizing part-to-whole hierarchical data.',
  category: 'chart',
  // Server HTML carries the SVG plus the accessible data <table> with the real values, so the
  // chart reads with JS off; JS adds hover, tooltips and transitions.
  clientJs: 'enhancement',
  states: [],
  variants: [],
  sizes: [],
  props: [
    {
      name: 'data',
      description: 'The hierarchical data to render as nested rectangles.',
      type: '{ id: string; label: string; value: number }[]',
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
  ],
  typeDefs: [
    {
      name: 'TreemapDatum',
      description: 'Shape of the `data` prop.',
      fields: [
        {
          name: 'id',
          type: 'string',
          required: true,
        },
        {
          name: 'label',
          type: 'string',
          required: true,
        },
        {
          name: 'value',
          type: 'number',
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
  accessibility: { role: 'img', wcag: '2.1-AA', keyboard: [] },
  examples: [
    {
      title: 'Basic treemap',
      code: `import { Treemap } from '@cascivo/charts'

const data = [
  {id:'a',label:'Alpha',value:40},
  {id:'b',label:'Beta',value:25},
  {id:'c',label:'Gamma',value:20},
  {id:'d',label:'Delta',value:15},
]
<Treemap data={data} title="Market share" />`,
    },
  ],
  dependencies: ['@cascivo/charts'],
  tags: ['chart', 'treemap', 'hierarchy', 'part-to-whole', 'data-viz'],
  intent: {
    whenToUse: [
      'Showing part-to-whole proportions across many segments in a compact area',
      'Visualising hierarchical magnitude where slice size encodes value',
    ],
    whenNotToUse: [
      'Few segments where a simple split reads better — use PieChart for ≤5',
      'Precise value comparison — area encoding is approximate',
    ],
    antiPatterns: [],
    related: [
      {
        name: 'PieChart',
        relationship: 'alternative',
        reason: 'Use for part-of-whole with five or fewer flat segments',
      },
      {
        name: 'Heatmap',
        relationship: 'alternative',
        reason: 'Use for magnitude across a two-dimensional grid',
      },
    ],
    a11yRationale: 'Renders with role="img" and requires a title prop for screen reader labeling.',
    flexibility: [],
  },
}
