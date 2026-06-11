import type { Meta, StoryObj } from '@storybook/react-vite'
import { Sparkline } from '@cascade-ui/charts'

const meta: Meta<typeof Sparkline> = {
  title: 'Charts/Sparkline',
  component: Sparkline,
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
type Story = StoryObj<typeof Sparkline>

export const Default: Story = {
  args: {
    data: [10, 20, 15, 30, 25, 40, 35, 50],
    label: 'Weekly trend',
    endDot: true,
  },
}

export const Flat: Story = {
  args: {
    data: [20, 22, 19, 21, 20, 23, 21],
    label: 'Stable metric',
  },
}

export const Wide: Story = {
  args: {
    data: [5, 15, 10, 25, 20, 35, 30, 45, 40],
    label: 'Wide sparkline',
    width: 160,
    height: 48,
    endDot: true,
  },
}
