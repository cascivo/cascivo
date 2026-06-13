import type { Meta, StoryObj } from '@storybook/react-vite'
import { LineChart } from '@cascivo/charts'

// Month-start dates for 2024
const MONTH_DATES = Array.from({ length: 12 }, (_, i) => new Date(2024, i, 1))

const series = [
  {
    id: 'revenue',
    label: 'Revenue ($k)',
    data: [42, 38, 51, 48, 63, 72, 69, 81, 75, 89, 95, 102].map((y, i) => ({
      x: MONTH_DATES[i]!,
      y,
    })),
  },
  {
    id: 'cost',
    label: 'Cost ($k)',
    data: [28, 25, 33, 31, 42, 47, 44, 52, 48, 58, 61, 66].map((y, i) => ({
      x: MONTH_DATES[i]!,
      y,
    })),
  },
]

const meta: Meta<typeof LineChart> = {
  title: 'Charts/LineChart',
  component: LineChart,
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
type Story = StoryObj<typeof LineChart>
type Pt = { x: Date; y: number }

const xDate = (d: unknown) => (d as Pt).x
const yVal = (d: unknown) => (d as Pt).y

export const Default: Story = {
  args: {
    series,
    x: xDate,
    y: yVal,
    title: 'Revenue vs Cost (2024)',
    legend: true,
    tooltip: true,
  },
}

export const SingleSeries: Story = {
  args: {
    series: [series[0]!],
    x: xDate,
    y: yVal,
    title: 'Monthly Revenue ($k)',
    tooltip: true,
  },
}

export const LinearCurve: Story = {
  args: {
    series,
    x: xDate,
    y: yVal,
    title: 'Linear interpolation',
    curve: 'linear',
    legend: true,
  },
}
