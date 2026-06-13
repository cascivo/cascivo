import type { Meta, StoryObj } from '@storybook/react-vite'
import { BarChart } from '@cascivo/charts'

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
