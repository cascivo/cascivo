import type { ComponentMeta } from '@cascivo/core'

export const meta: ComponentMeta = {
  name: 'ScatterChart',
  description: 'Scatter plot with variable point radius, multi-series, and hover tooltip.',
  category: 'chart',
  states: [],
  variants: [],
  sizes: [],
  props: [
    { name: 'series', type: 'ScatterChartSeries[]', required: true },
    { name: 'title', type: 'string', required: true },
    { name: 'description', type: 'string', required: false },
    {
      name: 'r',
      type: 'number | ((d: ScatterDatum) => number)',
      required: false,
      default: '4',
      description: 'Point radius or accessor',
    },
    { name: 'width', type: 'number', required: false },
    { name: 'height', type: 'number', required: false, default: '300' },
    { name: 'xTicks', type: 'number', required: false, default: '5' },
    { name: 'yTicks', type: 'number', required: false, default: '5' },
    { name: 'legend', type: 'boolean', required: false },
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
    {
      name: 'annotations',
      type: 'Annotation[]',
      required: false,
      description:
        'Reference lines, shaded bands, and markers drawn over the plot (e.g. a target/threshold line).',
    },
    {
      name: 'onSelect',
      type: '(point: ChartPoint) => void',
      required: false,
      description: 'Fired when a point is clicked or activated (Enter/Space) — for drill-down.',
    },
    {
      name: 'glyph',
      type: 'GlyphShape | ((d, seriesId) => GlyphShape)',
      required: false,
      description:
        'Point glyph shape (circle/square/diamond/triangle/cross/star) — a fixed shape or a function to encode a category by shape.',
    },
    {
      name: 'renderer',
      type: "'svg' | 'canvas' | 'auto'",
      required: false,
      default: 'svg',
      description:
        'Renderer — svg (default), canvas (force), or auto (canvas past ~2000 points). Canvas keeps the full a11y fallback table + keyboard layer.',
    },
    {
      name: 'visualMap',
      type: 'VisualMapOptions',
      required: false,
      description:
        'Map each point’s y → CVD-safe colour and/or size via a keyboard-operable legend that filters the visible range.',
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
      title: 'Basic scatter chart',
      code: `import { ScatterChart } from '@cascivo/charts'

const series = [{ id: 'a', label: 'Group A', data: [{x:1,y:2},{x:3,y:4}] }]
<ScatterChart series={series} title="Scatter" />`,
    },
  ],
  dependencies: ['@cascivo/charts'],
  tags: ['chart', 'scatter', 'plot', 'data-viz'],
  intent: {
    whenToUse: [
      'Revealing correlation or clustering between two numeric variables',
      'Plotting many individual observations across a 2D space',
    ],
    whenNotToUse: [
      'Encoding a third magnitude dimension — use BubbleChart',
      'Showing a trend over ordered time — use LineChart',
    ],
    antiPatterns: [],
    related: [
      {
        name: 'BubbleChart',
        relationship: 'alternative',
        reason: 'Use when a third size dimension must be encoded',
      },
      {
        name: 'LineChart',
        relationship: 'alternative',
        reason: 'Use when points form an ordered trend over time',
      },
    ],
    a11yRationale: 'Renders with role="img" and requires a title prop for screen reader labeling.',
    flexibility: [],
  },
}
