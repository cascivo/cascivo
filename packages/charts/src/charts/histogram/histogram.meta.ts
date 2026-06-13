import type { ComponentMeta } from '@cascade-ui/core'

export const meta: ComponentMeta = {
  name: 'Histogram',
  description: 'Frequency histogram using Freedman–Diaconis binning with hover tooltips.',
  category: 'chart',
  states: [],
  variants: [],
  sizes: [],
  props: [
    {
      name: 'data',
      type: 'number[]',
      required: true,
      description: 'Array of numeric values to bin',
    },
    {
      name: 'bins',
      type: 'number',
      required: false,
      description: 'Explicit bin count (defaults to Freedman–Diaconis)',
    },
    { name: 'title', type: 'string', required: true },
    { name: 'label', type: 'string', required: true, description: 'X-axis label' },
    { name: 'description', type: 'string', required: false },
    { name: 'width', type: 'number', required: false },
    { name: 'height', type: 'number', required: false, default: '300' },
    { name: 'className', type: 'string', required: false },
    {
      name: 'plain',
      type: 'boolean',
      required: false,
      default: 'false',
      description: 'Marks only — no axes, grid lines, or legend. For micro/inline charts.',
    },
  ],
  tokens: ['--cascade-chart-1'],
  accessibility: { role: 'img', wcag: '2.1-AA', keyboard: [] },
  examples: [
    {
      title: 'Basic histogram',
      code: `import { Histogram } from '@cascade-ui/charts'

const data = Array.from({length:100}, () => Math.random() * 100)
<Histogram data={data} title="Distribution" label="Value" />`,
    },
  ],
  dependencies: ['@cascade-ui/charts'],
  tags: ['chart', 'histogram', 'distribution', 'frequency', 'data-viz'],
  intent: {
    whenToUse: [
      'Showing the frequency distribution of a single continuous variable',
      'Revealing the shape, spread, and skew of binned numeric data',
    ],
    whenNotToUse: [
      'Comparing discrete labelled categories — use BarChart',
      'Comparing distribution summaries across groups — use Boxplot',
    ],
    antiPatterns: [],
    related: [
      {
        name: 'BarChart',
        relationship: 'alternative',
        reason: 'Use for discrete categorical values, not binned ranges',
      },
      {
        name: 'Boxplot',
        relationship: 'alternative',
        reason: 'Use to compare distribution summaries across multiple groups',
      },
    ],
    a11yRationale: 'Renders with role="img" and requires a title prop for screen reader labeling.',
    flexibility: [],
  },
}
