import type { ComponentMeta } from '@cascade-ui/core'

export const meta: ComponentMeta = {
  name: 'Bullet',
  description: 'Bullet chart with background range bands, measure bar, and target tick.',
  category: 'chart',
  states: [],
  variants: [],
  sizes: [],
  props: [
    { name: 'value', type: 'number', required: true, description: 'Current measure value' },
    { name: 'target', type: 'number', required: true, description: 'Target marker value' },
    {
      name: 'ranges',
      type: 'number[]',
      required: true,
      description: 'Qualitative range breakpoints (sorted ascending)',
    },
    { name: 'label', type: 'string', required: true },
    { name: 'min', type: 'number', required: false, default: '0' },
    {
      name: 'max',
      type: 'number',
      required: false,
      description: 'Domain maximum (defaults to last range)',
    },
    { name: 'width', type: 'number', required: false, default: '300' },
    { name: 'height', type: 'number', required: false, default: '40' },
    { name: 'className', type: 'string', required: false },
  ],
  tokens: [
    '--cascade-chart-1',
    '--cascade-color-neutral-200',
    '--cascade-color-neutral-300',
    '--cascade-color-neutral-400',
  ],
  accessibility: { role: 'img', wcag: '2.1-AA', keyboard: [] },
  examples: [
    {
      title: 'Basic bullet chart',
      code: `import { Bullet } from '@cascade-ui/charts'

<Bullet value={72} target={80} ranges={[40, 70, 100]} label="Revenue %" />`,
    },
  ],
  dependencies: ['@cascade-ui/charts'],
  tags: ['chart', 'bullet', 'kpi', 'progress', 'data-viz'],
  intent: {
    whenToUse: [
      'Showing a single measure against a target with qualitative range bands',
      'Compact dashboard KPIs where space for a full gauge is limited',
    ],
    whenNotToUse: [
      'Displaying a metric without a target or comparative range — use Kpi',
      'Showing a simple completion or rated value — use Meter',
    ],
    antiPatterns: [],
    related: [
      {
        name: 'Meter',
        relationship: 'alternative',
        reason: 'Use for a rated value within a range without a target marker',
      },
      {
        name: 'Kpi',
        relationship: 'alternative',
        reason: 'Use for a single headline metric with a delta',
      },
    ],
    a11yRationale: 'Renders with role="img" and requires a label prop for screen reader labeling.',
    flexibility: [],
  },
}
