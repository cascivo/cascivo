import type { Meta, StoryObj } from '@storybook/react-vite'
import { Heatmap } from '@cascivo/charts'

const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri']
const hours = ['AM', 'Midday', 'PM']
const data = days.flatMap((x) =>
  hours.map((y) => ({
    x,
    y,
    value: Math.round(10 + (days.indexOf(x) + 1) * (hours.indexOf(y) + 1) * 8),
  })),
)

const meta: Meta<typeof Heatmap> = {
  title: 'Charts/Heatmap',
  component: Heatmap,
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
type Story = StoryObj<typeof Heatmap>

export const Default: Story = {
  args: {
    data,
    title: 'Weekly activity heatmap',
  },
}
