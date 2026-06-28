import type { ComponentMeta } from '@cascivo/core'

export const meta: ComponentMeta = {
  name: 'LineChart',
  description:
    'Time-series or numeric line chart with multi-series support, hover tooltip, and legend.',
  category: 'chart',
  states: [],
  variants: [],
  sizes: [],
  props: [
    {
      name: 'series',
      type: 'LineChartSeries<Datum>[]',
      required: true,
      description: 'Array of data series',
    },
    {
      name: 'x',
      type: '(d: Datum) => number | Date',
      required: true,
      description: 'X-value accessor',
    },
    { name: 'y', type: '(d: Datum) => number', required: true, description: 'Y-value accessor' },
    {
      name: 'title',
      type: 'string',
      required: true,
      description: 'Chart title (also used as aria-label)',
    },
    {
      name: 'description',
      type: 'string',
      required: false,
      description: 'Subtitle shown below title',
    },
    {
      name: 'curve',
      type: "'linear' | 'monotone' | 'step' | 'stepBefore' | 'stepAfter' | 'natural' | 'basis' | 'cardinal' | 'catmullRom'",
      required: false,
      default: 'monotone',
      description: 'Line interpolation curve',
    },
    {
      name: 'width',
      type: 'number',
      required: false,
      description: 'Fixed SVG width (defaults to container width)',
    },
    {
      name: 'height',
      type: 'number',
      required: false,
      default: '300',
      description: 'SVG height in px',
    },
    {
      name: 'xTicks',
      type: 'number',
      required: false,
      default: '5',
      description: 'Approximate number of X-axis ticks',
    },
    {
      name: 'yTicks',
      type: 'number',
      required: false,
      default: '5',
      description: 'Approximate number of Y-axis ticks',
    },
    { name: 'legend', type: 'boolean', required: false, description: 'Show series legend' },
    { name: 'tooltip', type: 'boolean', required: false, description: 'Enable hover tooltip' },
    {
      name: 'formatTooltip',
      type: '(datum: Datum, series: LineChartSeries<Datum>) => string',
      required: false,
      description: 'Custom tooltip formatter',
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
      name: 'labels',
      type: 'boolean | { format?: (v: number) => string; position?: string }',
      required: false,
      description:
        'Print each value as a label on the mark (collision-aware, decorative/aria-hidden).',
    },
    {
      name: 'connectNulls',
      type: 'boolean',
      required: false,
      default: 'false',
      description: 'Bridge non-finite y gaps instead of breaking the line at them.',
    },
    {
      name: 'onSelect',
      type: '(point: ChartPoint) => void',
      required: false,
      description: 'Fired when a point is clicked or activated (Enter/Space) — for drill-down.',
    },
    {
      name: 'brush',
      type: 'boolean',
      required: false,
      default: 'false',
      description:
        'Show a keyboard-operable Brush below the plot to subset (zoom) the series to a window.',
    },
    {
      name: 'dataZoom',
      type: 'boolean',
      required: false,
      default: 'false',
      description:
        'Show a DataZoom slider below the plot — a Brush whose body also pans the window.',
    },
    {
      name: 'zoom',
      type: 'boolean',
      required: false,
      default: 'false',
      description:
        'Enable in-plot wheel/drag/keyboard zoom-pan (+/-/0) over the series index window, with a reset control and re-ticked axes.',
    },
    {
      name: 'syncId',
      type: 'string',
      required: false,
      description:
        'Connect this chart to others sharing the same id — they mirror the zoom window and hovered x.',
    },
    {
      name: 'tooltipMode',
      type: "'item' | 'axis'",
      required: false,
      default: 'item',
      description:
        'Tooltip trigger — item (nearest point) or axis (a crosshair + a shared tooltip listing every series at the hovered x).',
    },
    {
      name: 'decimate',
      type: "boolean | { method?: 'lttb' | 'minmax'; threshold?: number }",
      required: false,
      description:
        'Downsample dense series before drawing (LTTB or min-max). Visual only — the fallback table keeps the full data.',
    },
    {
      name: 'toolbox',
      type: 'boolean | ToolboxOptions',
      required: false,
      description:
        'Render a keyboard-reachable toolbox — PNG/SVG export, a data-view table toggle, and restore (reset zoom).',
    },
    {
      name: 'transition',
      type: 'boolean | { duration?: number; easing?: string; properties?: string[] }',
      required: false,
      description:
        'Tune the reduced-motion-gated enter/update transitions (false disables). Always suppressed under prefers-reduced-motion.',
    },
    {
      name: 'onBeforeDraw',
      type: '(ctx: { width: number; height: number }) => ReactNode',
      required: false,
      description:
        'Render custom SVG behind the marks (watermark/region) — a lightweight extension seam.',
    },
    {
      name: 'onAfterDraw',
      type: '(ctx: { width: number; height: number }) => ReactNode',
      required: false,
      description:
        'Render custom SVG over the marks (overlay/extra series) — a lightweight extension seam.',
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
      title: 'Basic line chart',
      code: `import { LineChart } from '@cascivo/charts'

const series = [{ id: 'a', label: 'Revenue', data: [{x:1,y:10},{x:2,y:20},{x:3,y:15}] }]
<LineChart series={series} x={d => d.x} y={d => d.y} title="Revenue" />`,
    },
    {
      title: 'With an SLO target line',
      code: `<LineChart
  series={series}
  x={d => d.x}
  y={d => d.y}
  title="Latency"
  annotations={[{ kind: 'line', axis: 'y', value: 200, label: 'SLO' }]}
/>`,
    },
  ],
  dependencies: ['@cascivo/charts'],
  tags: ['chart', 'line', 'time-series', 'data-viz'],
  intent: {
    whenToUse: [
      'Showing trends and precise values over continuous time or a numeric range',
      'Comparing the trajectory of multiple series on a shared scale',
    ],
    whenNotToUse: [
      'Comparing discrete categories — use BarChart',
      'Emphasising cumulative volume — use AreaChart',
    ],
    antiPatterns: [],
    related: [
      {
        name: 'AreaChart',
        relationship: 'alternative',
        reason: 'Use when filled cumulative volume matters more than precise values',
      },
      {
        name: 'BarChart',
        relationship: 'alternative',
        reason: 'Use for discrete categorical comparison',
      },
    ],
    a11yRationale: 'Renders with role="img" and requires a title prop for screen reader labeling.',
    flexibility: [],
  },
}
