import type { ComponentMeta } from '@cascivo/core'

export const meta: ComponentMeta = {
  name: 'BarChart',
  description:
    'Bar chart with vertical/horizontal orientation, grouped or stacked modes, and multi-series support.',
  category: 'chart',
  // Server HTML carries the SVG plus the accessible data <table> with the real values, so the
  // chart reads with JS off; JS adds hover, tooltips and transitions.
  clientJs: 'enhancement',
  states: [],
  variants: ['grouped', 'stacked', 'percent'],
  sizes: [],
  props: [
    {
      name: 'series',
      type: 'BarChartSeries<Datum>[]',
      required: true,
      description:
        'Series array. Each series accepts an optional `color` (any CSS color) overriding the positional palette for that series/stacked layer.',
    },
    {
      name: 'x',
      description:
        'Accessor returning the **category label** for a datum. BarChart uses a categorical **band** scale, so `x` returns a `string` — this differs from LineChart/AreaChart, whose `x` returns `number | Date` for a continuous/time scale. For a time-based bar chart, format the date to a label in the accessor (e.g. `x={(d) => d.day.toLocaleDateString()}`). For continuous or time-series data, prefer LineChart/AreaChart.',
      type: '(d: Datum) => string',
      required: true,
    },
    {
      name: 'y',
      description:
        'Accessor returning the numeric value for a datum, applied to every series unless a series sets its own `y`. One category (x) domain per chart; give each series a `y` to plot different fields from one shared data row.',
      type: '(d: Datum) => number',
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
      name: 'orientation',
      description:
        'Direction the bars grow. `vertical` puts the categories on the x-axis and grows bars upward (columns); `horizontal` puts them on the y-axis and grows bars rightward — the better choice for long category names.',
      type: "'vertical' | 'horizontal'",
      required: false,
      default: 'vertical',
    },
    {
      name: 'mode',
      type: "'grouped' | 'stacked' | 'percent'",
      required: false,
      default: 'grouped',
      description: "'percent' stacks each category and normalizes it to 100%.",
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
      default: '300',
    },
    {
      name: 'valueAxisTicks',
      description:
        'Approximate number of ticks on the VALUE axis, on both orientations. Prefer this over xTicks/yTicks, which are named for where the axis is drawn and therefore swap meaning when orientation="horizontal".',
      type: 'number',
      required: false,
      default: '5',
    },
    {
      name: 'categoryAxisTicks',
      description:
        'Approximate number of ticks on the CATEGORY axis, on both orientations. Role-named twin of valueAxisTicks.',
      type: 'number',
      required: false,
      default: '5',
    },
    {
      name: 'categoryLabelEvery',
      type: 'number',
      required: false,
      description:
        'Show every Nth category label (always the last) to thin a crowded axis. Role-named twin of xLabelEvery; always strides the category axis on both orientations.',
    },
    {
      name: 'xLabelEvery',
      type: 'number',
      required: false,
      description:
        'Show every Nth category label (always the last) to thin a crowded axis. Unlike xTicks/yTicks this does NOT swap with orientation — it always strides the category axis. categoryLabelEvery is the unambiguous name.',
    },
    {
      name: 'legend',
      description: 'Whether to show the legend.',
      type: 'boolean',
      required: false,
    },
    {
      name: 'tooltip',
      description: 'Whether to show tooltips on hover.',
      type: 'boolean',
      required: false,
    },
    {
      name: 'tooltipFormat',
      type: '(p: ChartPoint) => string',
      required: false,
      description:
        'Custom tooltip formatter. The stacked default lists "label · total" + each non-zero layer in its color.',
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
      name: 'annotations',
      type: 'Annotation[]',
      required: false,
      description:
        'Reference lines, shaded bands, and markers drawn over the plot (e.g. a target/threshold line).',
    },
    {
      name: 'labels',
      type: 'boolean | { format?: (v: number) => string; position?: string }',
      required: false,
      description:
        'Print each value as a label on the mark (collision-aware, decorative/aria-hidden).',
    },
    {
      name: 'onSelect',
      type: '(point: ChartPoint) => void',
      required: false,
      description: 'Fired when a point is clicked or activated (Enter/Space) — for drill-down.',
    },
    {
      name: 'fill',
      type: "'solid' | 'gradient' | 'pattern'",
      required: false,
      default: 'solid',
      description: 'Bar fill style — solid, a gradient, or a pattern.',
    },
    {
      name: 'patternKind',
      type: "'dots' | 'lines' | 'cross'",
      required: false,
      description: 'Pattern motif when fill="pattern".',
    },
    {
      name: 'format',
      type: '(value: number | string | Date) => string',
      required: false,
      description: 'Format each category/x-axis tick label.',
    },
  ],
  typeDefs: [
    {
      name: 'BarChartSeries<Datum>',
      description: 'One series (a set of bars). Pass an array via the `series` prop.',
      fields: [
        { name: 'id', type: 'string', required: true, description: 'Stable series identity.' },
        { name: 'label', type: 'string', required: true, description: 'Legend + tooltip label.' },
        {
          name: 'data',
          type: 'readonly Datum[]',
          required: true,
          description: 'Row data read by the `x`/`y` accessors.',
        },
        {
          name: 'color',
          type: 'string | ((datum: Datum, index: number) => string)',
          required: false,
          description:
            'Any CSS color overriding the positional palette (--cascivo-chart-N) for this series / stacked layer. Pass a FUNCTION to color each bar from its own datum — the single-series categorical case (incidents by severity, where SEV1 reads as danger regardless of which bar is tallest). Each bar is also stamped with data-x for CSS targeting.',
        },
      ],
    },
    {
      name: 'StackedRow',
      description: 'Row-oriented input to the `toStackedSeries(rows)` pivot helper.',
      fields: [
        { name: 'label', type: 'string', required: true, description: 'Category (one bar).' },
        {
          name: 'segments',
          type: 'StackedSegment[]',
          required: true,
          description:
            'Per-layer values: { key, value, color? }. First non-undefined color per key wins.',
        },
      ],
    },
    {
      name: 'StackedSegment',
      description: 'One layer of a stacked bar within a StackedRow.',
      fields: [
        {
          name: 'key',
          type: 'string',
          required: true,
          description: 'Layer key — becomes the series id/label (e.g. "Done").',
        },
        { name: 'value', type: 'number', required: true },
        {
          name: 'color',
          type: 'string',
          required: false,
          description: 'Optional CSS color for this layer.',
        },
      ],
    },
    {
      name: 'ChartPoint',
      description: 'Argument passed to the `tooltipFormat` callback.',
      fields: [
        { name: 'label', type: 'string', required: true, description: 'Category label.' },
        { name: 'value', type: 'number | string', required: true },
        {
          name: 'color',
          type: 'string',
          required: false,
          description: 'Resolved mark color (the default tooltip tints its text with this).',
        },
        {
          name: 'segments',
          type: 'readonly { label: string; value: number; color?: string }[]',
          required: false,
          description:
            'Per-layer breakdown for a stacked category; the default stacked tooltip lists these.',
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
      title: 'Basic bar chart',
      code: `import { BarChart } from '@cascivo/charts'

const series = [{ id: 'a', label: 'Sales', data: [{x:'Jan',y:100},{x:'Feb',y:150}] }]
<BarChart series={series} x={d => d.x} y={d => d.y} title="Sales" />`,
    },
    {
      title: 'Date-based categories (format the Date in the accessor)',
      description:
        "BarChart's x is a category string, not a Date. When your data is date-keyed, format the Date to a label string inside the x accessor — do NOT return the Date itself (that is a type error; only LineChart/AreaChart take a Date x).",
      code: `import { BarChart } from '@cascivo/charts'

const series = [{ id: 'signups', label: 'Signups', data: [
  { day: new Date('2026-07-01'), count: 12 },
  { day: new Date('2026-07-02'), count: 18 },
] }]
<BarChart
  series={series}
  x={(d) => d.day.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
  y={(d) => d.count}
  xLabelEvery={2}
  title="Daily signups"
/>`,
    },
    {
      title: 'Stacked bar from row-oriented data',
      code: `import { BarChart, toStackedSeries } from '@cascivo/charts'

// Pivot { label, segments[] } rows into series + x/y. Per-segment color is preserved.
const rows = [
  { label: 'Mon', segments: [
    { key: 'Done', value: 5, color: 'var(--cascivo-color-success)' },
    { key: 'Blocked', value: 2, color: 'var(--cascivo-color-destructive)' },
  ] },
  { label: 'Tue', segments: [
    { key: 'Done', value: 8, color: 'var(--cascivo-color-success)' },
    { key: 'Blocked', value: 1, color: 'var(--cascivo-color-destructive)' },
  ] },
]
// Tooltip shows "Mon · 7" then each non-zero layer in its color.
<BarChart mode="stacked" tooltip {...toStackedSeries(rows)} title="Throughput" />`,
    },
  ],
  dependencies: ['@cascivo/charts'],
  tags: ['chart', 'bar', 'data-viz'],
  intent: {
    whenToUse: [
      'Comparing discrete categorical values across groups',
      'Showing grouped or stacked multi-series data per category',
    ],
    whenNotToUse: [
      'Showing trends over continuous time — use LineChart',
      'Part-of-whole proportions — use PieChart for ≤5 categories',
    ],
    antiPatterns: [],
    related: [
      {
        name: 'LineChart',
        relationship: 'alternative',
        reason: 'Use for trends over continuous time',
      },
      {
        name: 'Histogram',
        relationship: 'alternative',
        reason: 'Use to show the distribution of a continuous variable',
      },
    ],
    a11yRationale: 'Renders with role="img" and requires a title prop for screen reader labeling.',
    flexibility: [],
  },
}
