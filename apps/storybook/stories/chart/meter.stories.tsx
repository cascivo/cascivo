import type { Meta, StoryObj } from '@storybook/react-vite'
import { Meter } from '@cascivo/charts'

const meta: Meta<typeof Meter> = {
  title: 'Charts/Meter',
  component: Meter,
  parameters: { layout: 'fullscreen' },
  decorators: [
    (Story) => (
      <div style={{ inlineSize: 'min(32rem, 90vw)', padding: '2rem' }}>
        <Story />
      </div>
    ),
  ],
}
export default meta
type Story = StoryObj<typeof Meter>

export const Bar: Story = { args: { label: 'Disk usage', value: 68, variant: 'bar' } }
export const Gauge: Story = { args: { label: 'CPU', value: 82, variant: 'gauge' } }
export const WithThresholds: Story = {
  args: { label: 'Memory', value: 91, thresholds: { warning: 70, critical: 85 } },
}
