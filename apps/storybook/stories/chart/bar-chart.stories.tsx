import type { Meta, StoryObj } from '@storybook/react-vite'
import { BarChart } from '@cascade-ui/charts'

const series = [
  {
    id: 'q1',
    label: 'Q1',
    data: [
      { x: 'Jan', y: 400 },
      { x: 'Feb', y: 520 },
      { x: 'Mar', y: 480 },
    ],
  },
  {
    id: 'q2',
    label: 'Q2',
    data: [
      { x: 'Jan', y: 340 },
      { x: 'Feb', y: 460 },
      { x: 'Mar', y: 510 },
    ],
  },
]

const meta: Meta<typeof BarChart> = {
  title: 'Charts/BarChart',
  component: BarChart,
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
type Story = StoryObj<typeof BarChart>
type Pt = { x: string; y: number }

export const Default: Story = {
  args: {
    series,
    x: (d) => (d as Pt).x,
    y: (d) => (d as Pt).y,
    title: 'Quarterly Sales',
    legend: true,
  },
}

export const Stacked: Story = {
  args: {
    series,
    x: (d) => (d as Pt).x,
    y: (d) => (d as Pt).y,
    title: 'Stacked quarterly sales',
    mode: 'stacked',
    legend: true,
  },
}

export const Horizontal: Story = {
  args: {
    series: [series[0]!],
    x: (d) => (d as Pt).x,
    y: (d) => (d as Pt).y,
    title: 'Horizontal bar',
    orientation: 'horizontal',
  },
}
