import type { Meta, StoryObj } from '@storybook/react-vite'
import { Kpi } from '@cascivo/charts'

const meta: Meta<typeof Kpi> = {
  title: 'Charts/Kpi',
  component: Kpi,
  parameters: { layout: 'fullscreen' },
  decorators: [
    (Story) => (
      <div style={{ inlineSize: 'min(24rem, 90vw)', padding: '2rem' }}>
        <Story />
      </div>
    ),
  ],
}
export default meta
type Story = StoryObj<typeof Kpi>

export const Default: Story = {
  args: { label: 'MRR', value: '$48.2k', delta: 12.4, deltaLabel: 'vs last month' },
}
export const WithSparkline: Story = {
  args: {
    label: 'Active users',
    value: '8,421',
    delta: -3.1,
    sparkline: [20, 24, 22, 28, 26, 30, 27, 25],
  },
}
