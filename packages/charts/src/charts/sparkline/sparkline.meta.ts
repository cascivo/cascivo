import type { ComponentMeta } from '@cascivo/core'

export const meta: ComponentMeta = {
  name: 'Sparkline',
  description: 'Compact inline sparkline for embedding trend data in dashboards or KPI cards.',
  category: 'chart',
  clientJs: 'none',
  states: [],
  variants: [],
  sizes: [],
  props: [
    { name: 'data', type: 'number[]', required: true, description: 'Array of numeric values' },
    {
      name: 'label',
      type: 'string',
      required: false,
      description: 'Accessible name for the chart (invisible — rendered as the SVG `<title>`).',
    },
    {
      name: 'ariaLabel',
      type: 'string',
      required: false,
      description:
        'Alias for `label` (the catalog convention for an invisible accessible name). Both work; pass exactly one.',
    },
    {
      name: 'width',
      description:
        'SVG width in px. **This chart is fixed-width by default** — it is a compact, inline chart meant to sit in a table cell or beside a label, so omitting `width` gives you 120px rather than a container-filling chart. Pass a number to change it. The catalogue-wide "omit for a responsive chart" note does not apply to this chart.',
      type: 'number',
      required: false,
      default: '120',
    },
    {
      name: 'height',
      description:
        "SVG height in px. Unlike `width`, height does NOT track the container — this is the knob you set to change the chart's aspect.",
      type: 'number',
      required: false,
      default: '32',
    },
    {
      name: 'color',
      type: 'string',
      required: false,
      description: 'Stroke color (CSS value)',
      default: "'var(--cascivo-chart-1)'",
    },
    {
      name: 'endDot',
      type: 'boolean',
      required: false,
      description: 'Show dot at last data point',
      default: 'true',
    },
  ],
  tokens: ['--cascivo-chart-1'],
  accessibility: { role: 'img', wcag: '2.1-AA', keyboard: [] },
  examples: [
    {
      title: 'Inline sparkline',
      code: `import { Sparkline } from '@cascivo/charts'

<Sparkline data={[10, 20, 15, 30, 25]} label="Trend" endDot />`,
    },
  ],
  dependencies: ['@cascivo/charts'],
  tags: ['chart', 'sparkline', 'inline', 'trend', 'data-viz'],
  intent: {
    whenToUse: [
      'Embedding a compact micro-trend inline in text, tables, or KPI cards',
      'Conveying direction at a glance where a full chart would be too large',
    ],
    whenNotToUse: [
      'Reading precise values or axes are needed — use LineChart',
      'As a standalone primary chart with its own panel',
    ],
    antiPatterns: [],
    related: [
      {
        name: 'LineChart',
        relationship: 'alternative',
        reason: 'Use as a full chart when axes and tooltips are needed',
      },
      {
        name: 'Kpi',
        relationship: 'contained-by',
        reason: 'Commonly embedded inside a KPI card as a trend indicator',
      },
    ],
    a11yRationale: 'Renders with role="img" and requires a label prop for screen reader labeling.',
    flexibility: [],
  },
}
