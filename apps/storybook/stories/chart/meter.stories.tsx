import type { Meta, StoryObj } from '@storybook/react-vite'
import { Meter } from '@cascivo/charts'

const meta: Meta<typeof Meter> = {
  title: 'Charts/Meter',
  component: Meter,
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
type Story = StoryObj<typeof Meter>

export const Default: Story = {
  args: {
    value: 72,
    label: 'CPU usage',
  },
}

export const WithThresholds: Story = {
  args: {
    value: 85,
    label: 'Memory usage',
    thresholds: { warning: 70, critical: 90 },
  },
}

export const Gauge: Story = {
  args: {
    value: 65,
    label: 'Disk I/O',
    variant: 'gauge',
  },
}

export const Low: Story = {
  args: {
    value: 15,
    label: 'Network load',
    thresholds: { warning: 60, critical: 80 },
  },
}
