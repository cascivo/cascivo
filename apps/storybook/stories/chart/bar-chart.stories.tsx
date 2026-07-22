import type { Meta, StoryObj } from '@storybook/react-vite'
import { BarChart, toStackedSeries, type BarChartSeries } from '@cascivo/charts'

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

const series = [
  {
    id: 'revenue',
    label: 'Revenue',
    data: [42000, 38500, 51200, 47800, 63400, 72100, 68900, 81200, 74600, 89300, 95100, 102400].map(
      (y, i) => ({ x: MONTHS[i]!, y }),
    ),
  },
  {
    id: 'cost',
    label: 'Cost',
    data: [28000, 25100, 33400, 31200, 41800, 46500, 44200, 52300, 48100, 57600, 61400, 65800].map(
      (y, i) => ({ x: MONTHS[i]!, y }),
    ),
  },
]

const meta: Meta<typeof BarChart> = {
  title: 'Charts/BarChart',
  component: BarChart,
  parameters: { layout: 'fullscreen' },
  decorators: [
    (Story) => (
      <div style={{ inlineSize: 'min(48rem, 90vw)', padding: '2rem' }}>
        <Story />
      </div>
    ),
  ],
}
export default meta
type Story = StoryObj<typeof BarChart>
type Pt = { x: string; y: number }

export const Default: Story = {
  args: {
    series,
    x: (d) => (d as Pt).x,
    y: (d) => (d as Pt).y,
    title: 'Annual Revenue vs Cost',
    legend: true,
  },
}

export const Stacked: Story = {
  args: {
    series,
    x: (d) => (d as Pt).x,
    y: (d) => (d as Pt).y,
    title: 'Stacked annual revenue vs cost',
    mode: 'stacked',
    legend: true,
  },
}

const rows = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'].map((label, i) => ({
  label,
  segments: [
    { key: 'Done', value: [5, 8, 6, 9, 7][i]!, color: 'var(--cascivo-color-success)' },
    { key: 'In progress', value: [3, 2, 4, 1, 3][i]!, color: 'var(--cascivo-color-warning)' },
    { key: 'Blocked', value: [2, 1, 0, 2, 1][i]!, color: 'var(--cascivo-color-destructive)' },
  ],
}))

export const StackedFromRows: Story = {
  args: {
    // toStackedSeries pre-shapes each series to {x,y} with its own `y` accessor;
    // Storybook widens the chart's Datum to `unknown`, so bridge through unknown
    // (the per-series accessor is contravariant in Datum). Runtime is correct.
    series: toStackedSeries(rows).series as unknown as readonly BarChartSeries<unknown>[],
    x: (d) => (d as Pt).x,
    y: (d) => (d as Pt).y,
    title: 'Throughput by day (from row data)',
    mode: 'stacked',
    tooltip: true,
    legend: true,
  },
}

export const Horizontal: Story = {
  args: {
    series: [
      {
        id: 'revenue',
        label: 'Revenue',
        data: ['Q1', 'Q2', 'Q3', 'Q4'].map((x, i) => ({
          x,
          y: [131700, 183300, 224700, 262900][i]!,
        })),
      },
    ],
    x: (d) => (d as Pt).x,
    y: (d) => (d as Pt).y,
    title: 'Quarterly revenue',
    orientation: 'horizontal',
  },
}

const mix = [
  {
    id: 'done',
    label: 'Done',
    data: [
      { x: 'Mon', y: 5 },
      { x: 'Tue', y: 8 },
      { x: 'Wed', y: 6 },
    ],
  },
  {
    id: 'wip',
    label: 'In progress',
    data: [
      { x: 'Mon', y: 3 },
      { x: 'Tue', y: 2 },
      { x: 'Wed', y: 4 },
    ],
  },
  {
    id: 'todo',
    label: 'Todo',
    data: [
      { x: 'Mon', y: 4 },
      { x: 'Tue', y: 1 },
      { x: 'Wed', y: 5 },
    ],
  },
]

export const PercentStacked: Story = {
  args: {
    series: mix,
    x: (d) => (d as Pt).x,
    y: (d) => (d as Pt).y,
    title: 'Status mix (100% stacked)',
    mode: 'percent',
    tooltip: true,
    legend: true,
  },
}

export const WithLabelsAndTarget: Story = {
  args: {
    series: [mix[0]!],
    x: (d) => (d as Pt).x,
    y: (d) => (d as Pt).y,
    title: 'Throughput with labels + SLA line',
    labels: true,
    annotations: [{ kind: 'line', axis: 'y', value: 6, label: 'SLA' }],
  },
}
