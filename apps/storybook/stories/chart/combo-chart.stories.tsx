import type { Meta, StoryObj } from '@storybook/react-vite'
import { ComboChart } from '@cascivo/charts'

const bars = [
  { label: 'Jan', value: 120 },
  { label: 'Feb', value: 145 },
  { label: 'Mar', value: 110 },
  { label: 'Apr', value: 160 },
  { label: 'May', value: 135 },
  { label: 'Jun', value: 175 },
]
const line = [
  { x: 0, y: 80 },
  { x: 1, y: 95 },
  { x: 2, y: 75 },
  { x: 3, y: 105 },
  { x: 4, y: 90 },
  { x: 5, y: 115 },
]

const meta: Meta<typeof ComboChart> = {
  title: 'Charts/ComboChart',
  component: ComboChart,
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
type Story = StoryObj<typeof ComboChart>

export const Default: Story = {
  args: {
    bars,
    line,
    title: 'Sales vs Target',
  },
}

export const DualAxis: Story = {
  args: {
    bars,
    line,
    title: 'Sales vs Conversion rate',
    secondAxis: true,
  },
}
