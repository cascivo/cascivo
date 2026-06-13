import type { Meta, StoryObj } from '@storybook/react-vite'
import { StatsBand } from '@cascivo/layouts/sections/stats-band'

const meta: Meta<typeof StatsBand> = {
  title: 'Sections/StatsBand',
  component: StatsBand,
  parameters: { layout: 'fullscreen' },
}
export default meta
type Story = StoryObj<typeof StatsBand>

export const WithTrends: Story = {
  render: () => (
    <StatsBand
      aria-label="Performance metrics"
      stats={[
        {
          label: 'p99 latency',
          value: '184 ms',
          delta: '-12 ms',
          trend: [210, 205, 198, 192, 184],
        },
        {
          label: 'Error rate',
          value: '0.12%',
          delta: '-0.03%',
          trend: [0.18, 0.16, 0.15, 0.14, 0.12],
        },
        { label: 'Uptime', value: '99.98%', trend: [99.95, 99.97, 99.98, 99.99, 99.98] },
        { label: 'Deploys today', value: '7' },
      ]}
    />
  ),
}

export const NoTrends: Story = {
  render: () => (
    <StatsBand
      stats={[
        { label: 'Total users', value: '48,291', delta: '+1,204' },
        { label: 'Active today', value: '3,847', delta: '+312' },
        { label: 'MRR', value: '$182k', delta: '+$8.4k' },
        { label: 'Churn rate', value: '1.2%', delta: '-0.1%' },
      ]}
    />
  ),
}
