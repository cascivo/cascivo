import type { Meta, StoryObj } from '@storybook/react-vite'
import { PieChart } from '@cascade-ui/charts'

const data = [
  { id: 'chrome', label: 'Chrome', value: 62 },
  { id: 'safari', label: 'Safari', value: 20 },
  { id: 'firefox', label: 'Firefox', value: 10 },
  { id: 'edge', label: 'Edge', value: 5 },
  { id: 'other', label: 'Other', value: 3 },
]

const meta: Meta<typeof PieChart> = {
  title: 'Charts/PieChart',
  component: PieChart,
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
type Story = StoryObj<typeof PieChart>

export const Default: Story = {
  args: {
    data,
    title: 'Browser market share',
    legend: true,
  },
}

export const Donut: Story = {
  args: {
    data,
    title: 'Browser market share (donut)',
    donut: true,
    legend: true,
  },
}
