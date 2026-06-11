import type { Meta, StoryObj } from '@storybook/react-vite'
import { BubbleChart } from '@cascade-ui/charts'

const series = [
  {
    name: 'North America',
    data: [
      { x: 12, y: 48, size: 80 },
      { x: 22, y: 62, size: 120 },
      { x: 35, y: 55, size: 60 },
      { x: 45, y: 70, size: 100 },
    ],
  },
  {
    name: 'Europe',
    data: [
      { x: 8, y: 35, size: 50 },
      { x: 18, y: 52, size: 90 },
      { x: 28, y: 44, size: 70 },
      { x: 40, y: 58, size: 110 },
    ],
  },
]

const meta: Meta<typeof BubbleChart> = {
  title: 'Charts/BubbleChart',
  component: BubbleChart,
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
type Story = StoryObj<typeof BubbleChart>

export const Default: Story = {
  args: {
    series,
    title: 'Regional market bubble',
  },
}

export const SingleSeries: Story = {
  args: {
    series: [series[0]!],
    title: 'North America growth',
  },
}
