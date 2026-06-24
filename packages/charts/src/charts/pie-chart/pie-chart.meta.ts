import type { ComponentMeta } from '@cascivo/core'

export const meta: ComponentMeta = {
  name: 'PieChart',
  description: 'Pie or donut chart with hover segments and optional legend.',
  category: 'chart',
  states: [],
  variants: ['pie', 'donut'],
  sizes: [],
  props: [
    {
      name: 'data',
      type: 'PieChartDatum[]',
      required: true,
      description:
        'Array of { id, label, value, color? } datums. Optional per-datum `color` (any CSS color) overrides the positional palette for that slice.',
    },
    { name: 'title', type: 'string', required: true },
    { name: 'description', type: 'string', required: false },
    { name: 'donut', type: 'boolean', required: false, description: 'Render as donut chart' },
    { name: 'width', type: 'number', required: false },
    { name: 'height', type: 'number', required: false, default: '300' },
    {
      name: 'size',
      type: 'number',
      required: false,
      description: 'Square shorthand: sets width === height. Explicit width/height win.',
    },
    {
      name: 'thickness',
      type: 'number',
      required: false,
      description: 'Ring width in px (donut only); defaults to 0.4 × radius.',
    },
    {
      name: 'innerRadius',
      type: 'number',
      required: false,
      description:
        'Inner radius in px (donut only); takes precedence over thickness; clamped to [0, outerRadius).',
    },
    {
      name: 'centerValue',
      type: 'string',
      required: false,
      description: 'Center value text rendered in the donut hole (donut only).',
    },
    {
      name: 'centerLabel',
      type: 'string',
      required: false,
      description: 'Center label text rendered below the value (donut only).',
    },
    {
      name: 'centerSlot',
      type: 'ReactNode',
      required: false,
      description:
        'Arbitrary content for the donut hole; takes precedence over centerValue/centerLabel.',
    },
    {
      name: 'emptyLabel',
      type: 'string',
      required: false,
      description: 'Visible placeholder text when data is empty. Defaults to the i18n "No data".',
    },
    {
      name: 'tooltipFormat',
      type: '(p: ChartPoint) => string',
      required: false,
      description: 'Custom tooltip formatter. Defaults to "value (pct%)" in the slice color.',
    },
    { name: 'legend', type: 'boolean', required: false },
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
      title: 'Basic pie chart',
      code: `import { PieChart } from '@cascivo/charts'

<PieChart data={[{label:'A',value:60},{label:'B',value:40}]} title="Market share" />`,
    },
    {
      title: 'Donut with center total and custom thickness',
      code: `import { PieChart } from '@cascivo/charts'

<PieChart
  donut
  size={220}
  thickness={28}
  centerValue="142"
  centerLabel="Total tasks"
  data={[
    { id: 'done', label: 'Done', value: 92, color: 'var(--cascivo-color-success)' },
    { id: 'wip', label: 'In progress', value: 34, color: 'var(--cascivo-color-warning)' },
    { id: 'blocked', label: 'Blocked', value: 16, color: 'var(--cascivo-color-destructive)' },
  ]}
  title="Task status"
/>`,
    },
    {
      title: 'Percentage tooltip + empty state',
      code: `import { PieChart } from '@cascivo/charts'

// Default tooltip shows "value (pct%)" in the slice color; pass tooltipFormat to override.
<PieChart data={[{id:'a',label:'A',value:60},{id:'b',label:'B',value:40}]} title="Share" />

// Empty data renders a visible "No data" placeholder (override via emptyLabel).
<PieChart data={[]} title="Share" emptyLabel="Nothing tracked yet" />`,
    },
  ],
  dependencies: ['@cascivo/charts'],
  tags: ['chart', 'pie', 'donut', 'data-viz'],
  intent: {
    whenToUse: [
      'Showing part-of-whole proportions with five or fewer slices',
      'A single composition at one point in time',
    ],
    whenNotToUse: [
      'Comparing precise values or many categories — use BarChart',
      'Showing change over time — use LineChart or AreaChart',
    ],
    antiPatterns: [],
    related: [
      {
        name: 'BarChart',
        relationship: 'alternative',
        reason: 'Use when comparing more than five categories or precise values',
      },
      {
        name: 'Treemap',
        relationship: 'alternative',
        reason: 'Use for part-to-whole with many or hierarchical segments',
      },
    ],
    a11yRationale: 'Renders with role="img" and requires a title prop for screen reader labeling.',
    flexibility: [],
  },
}
