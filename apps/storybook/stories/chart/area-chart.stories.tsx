import type { Meta, StoryObj } from '@storybook/react-vite'
import { AreaChart } from '@cascivo/charts'

const series = [
  {
    id: 'downloads',
    label: 'Downloads',
    data: [
      { x: 1, y: 120 },
      { x: 2, y: 180 },
      { x: 3, y: 150 },
      { x: 4, y: 210 },
      { x: 5, y: 190 },
      { x: 6, y: 240 },
      { x: 7, y: 260 },
    ],
  },
  {
    id: 'installs',
    label: 'Installs',
    data: [
      { x: 1, y: 80 },
      { x: 2, y: 110 },
      { x: 3, y: 95 },
      { x: 4, y: 130 },
      { x: 5, y: 120 },
      { x: 6, y: 155 },
      { x: 7, y: 170 },
    ],
  },
]

const meta: Meta<typeof AreaChart> = {
  title: 'Charts/AreaChart',
  component: AreaChart,
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
type Story = StoryObj<typeof AreaChart>

type Pt = { x: number; y: number }

export const Default: Story = {
  args: {
    series,
    x: (d) => (d as Pt).x,
    y: (d) => (d as Pt).y,
    title: 'Downloads & Installs',
    legend: true,
  },
}

export const Stacked: Story = {
  args: {
    series,
    x: (d) => (d as Pt).x,
    y: (d) => (d as Pt).y,
    title: 'Stacked area',
    stacked: true,
    legend: true,
  },
}
