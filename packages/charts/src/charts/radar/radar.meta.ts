import type { ComponentMeta } from '@cascivo/core'

export const meta: ComponentMeta = {
  name: 'Radar',
  description:
    'Radar / spider chart with polar grid rings, spokes, and multi-series polygon overlays.',
  category: 'chart',
  states: [],
  variants: [],
  sizes: [],
  props: [
    {
      name: 'axes',
      type: 'string[]',
      required: true,
      description: 'Axis labels (one per dimension)',
    },
    {
      name: 'series',
      type: '{ id: string; label: string; values: number[] }[]',
      required: true,
      description: 'One value per axis per series',
    },
    {
      name: 'max',
      type: 'number',
      required: false,
      description: 'Maximum value (defaults to data max)',
    },
    { name: 'title', description: 'Title text for the component.', type: 'string', required: true },
    {
      name: 'description',
      description: 'Supporting description text.',
      type: 'string',
      required: false,
    },
    { name: 'width', description: 'Width of the component.', type: 'number', required: false },
    {
      name: 'height',
      description: 'Height of the component.',
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
      title: 'Basic radar chart',
      code: `import { Radar } from '@cascivo/charts'

const axes = ['Speed','Power','Range','Efficiency','Cost']
const series = [{ id:'a', label:'Model A', values:[80,70,60,90,50] }]
<Radar axes={axes} series={series} title="Model comparison" />`,
    },
  ],
  dependencies: ['@cascivo/charts'],
  tags: ['chart', 'radar', 'spider', 'polar', 'data-viz'],
  intent: {
    whenToUse: [
      'Comparing several entities across the same set of quantitative dimensions',
      'Showing a multi-attribute profile or balance at a glance',
    ],
    whenNotToUse: [
      'Precise value reading — polar axes distort comparison',
      'More than a few series — overlapping polygons become unreadable',
    ],
    antiPatterns: [],
    related: [
      {
        name: 'BarChart',
        relationship: 'alternative',
        reason: 'Use when precise per-dimension comparison matters',
      },
    ],
    a11yRationale: 'Renders with role="img" and requires a title prop for screen reader labeling.',
    flexibility: [],
  },
}
