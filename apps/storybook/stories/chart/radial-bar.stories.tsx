import type { Meta, StoryObj } from '@storybook/react-vite'
import { RadialBar } from '@cascivo/charts'

const data = [
  { id: 'rev', label: 'Revenue', value: 84 },
  { id: 'nps', label: 'NPS', value: 61 },
  { id: 'ret', label: 'Retention', value: 72 },
]

const meta: Meta<typeof RadialBar> = {
  title: 'Charts/RadialBar',
  component: RadialBar,
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
type Story = StoryObj<typeof RadialBar>

export const Default: Story = {
  args: {
    data,
    title: 'Quarterly goals',
    max: 100,
    tooltip: true,
    legend: true,
  },
}

export const WithCenter: Story = {
  args: {
    data,
    title: 'Quarterly goals',
    max: 100,
    size: 280,
    centerValue: '72%',
    centerLabel: 'On track',
    legend: true,
  },
}

export const FullRing: Story = {
  args: {
    data,
    title: 'Full-ring gauges',
    max: 100,
    sweep: 360,
    legend: true,
  },
}

export const Empty: Story = {
  args: {
    data: [],
    title: 'No data yet',
  },
}
