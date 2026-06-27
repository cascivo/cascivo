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
  args: { label: 'Revenue', value: 72, target: 80, ranges: [50, 75, 100], max: 100 },
}
export const OverTarget: Story = {
  args: { label: 'Signups', value: 94, target: 80, ranges: [50, 75, 100], max: 100 },
}
