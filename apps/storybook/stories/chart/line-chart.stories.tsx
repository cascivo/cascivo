import type { Meta, StoryObj } from '@storybook/react-vite'
import { LineChart } from '@cascade-ui/charts'

const series = [
  {
    id: 'revenue',
    label: 'Revenue',
    data: [
      { x: 1, y: 42 },
      { x: 2, y: 58 },
      { x: 3, y: 51 },
      { x: 4, y: 74 },
      { x: 5, y: 68 },
      { x: 6, y: 83 },
      { x: 7, y: 91 },
    ],
  },
  {
    id: 'cost',
    label: 'Cost',
    data: [
      { x: 1, y: 30 },
      { x: 2, y: 35 },
      { x: 3, y: 32 },
      { x: 4, y: 40 },
      { x: 5, y: 38 },
      { x: 6, y: 45 },
      { x: 7, y: 48 },
    ],
  },
]

const meta: Meta<typeof LineChart> = {
  title: 'Charts/LineChart',
  component: LineChart,
  parameters: { layout: 'fullscreen' },
  decorators: [
    (Story) => (
      <div style={{ inlineSize: 'min(40rem, 90vw)', padding: '2rem' }}>
        <Story />
      </div>
    ),
  ],
}
export default meta
type Story = StoryObj<typeof LineChart>
type Pt = { x: number; y: number }

export const Default: Story = {
  args: {
    series,
    x: (d) => (d as Pt).x,
    y: (d) => (d as Pt).y,
    title: 'Revenue vs Cost',
    legend: true,
    tooltip: true,
  },
}

export const SingleSeries: Story = {
  args: {
    series: [series[0]!],
    x: (d) => (d as Pt).x,
    y: (d) => (d as Pt).y,
    title: 'Monthly Revenue',
    tooltip: true,
  },
}

export const LinearCurve: Story = {
  args: {
    series,
    x: (d) => (d as Pt).x,
    y: (d) => (d as Pt).y,
    title: 'Linear interpolation',
    curve: 'linear',
    legend: true,
  },
}
