import type { Meta, StoryObj } from '@storybook/react-vite'
import { Kpi } from '@cascade-ui/charts'

const meta: Meta<typeof Kpi> = {
  title: 'Charts/Kpi',
  component: Kpi,
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
type Story = StoryObj<typeof Kpi>

export const Default: Story = {
  args: {
    value: '$12,400',
    label: 'Monthly revenue',
    delta: 8.2,
    deltaLabel: 'vs last month',
  },
}

export const WithSparkline: Story = {
  args: {
    value: '4,821',
    label: 'Active users',
    delta: 3.1,
    deltaLabel: 'vs last week',
    sparkline: [38, 42, 39, 51, 47, 55, 52, 60],
  },
}

export const Negative: Story = {
  args: {
    value: '98.2%',
    label: 'Uptime',
    delta: -1.8,
    deltaLabel: 'vs last month',
  },
}
