import type { Meta, StoryObj } from '@storybook/react-vite'
import { Avatar } from '@cascade-ui/components/avatar'

const meta: Meta<typeof Avatar> = {
  component: Avatar,
  args: { fallback: 'JD' },
}
export default meta
type Story = StoryObj<typeof Avatar>

export const Fallback: Story = {}
export const BrokenImage: Story = {
  args: { src: 'https://invalid.example/x.png', alt: 'Jane Doe', fallback: 'JD' },
}
export const StatusOnline: Story = { args: { status: 'online' } }
export const StatusOffline: Story = { args: { status: 'offline' } }
export const StatusBusy: Story = { args: { status: 'busy' } }

export const AllSizes: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
      {(['xs', 'sm', 'md', 'lg', 'xl'] as const).map((size) => (
        <Avatar key={size} size={size} fallback="AB" />
      ))}
    </div>
  ),
}

export const Accessibility: Story = {
  args: { fallback: 'JD', status: 'online' },
  parameters: { a11y: { test: 'error' } },
}
