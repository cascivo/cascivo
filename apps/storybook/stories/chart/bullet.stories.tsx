import type { Meta, StoryObj } from '@storybook/react-vite'
import { Bullet } from '@cascivo/charts'

const meta: Meta<typeof Bullet> = {
  title: 'Charts/Bullet',
  component: Bullet,
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
type Story = StoryObj<typeof Bullet>

export const Default: Story = {
  args: {
    value: 72,
    target: 80,
    ranges: [40, 70, 100],
    label: 'Revenue %',
  },
}

export const AboveTarget: Story = {
  args: {
    value: 88,
    target: 80,
    ranges: [40, 70, 100],
    label: 'Q2 attainment',
  },
}

export const BelowWarning: Story = {
  args: {
    value: 35,
    target: 60,
    ranges: [40, 70, 100],
    label: 'Pipeline coverage',
  },
}
