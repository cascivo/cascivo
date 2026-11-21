// AUTO-GENERATED — do not edit; run `pnpm stories:generate`.
import type { Meta, StoryObj } from '@storybook/react-vite'
import { Avatar, Badge, Card, Indicator } from '@cascivo/react'

const meta: Meta = {
  title: 'Layout/Indicator',
}
export default meta
type Story = StoryObj

export const OnlineStatus: Story = {
  name: 'Online status',
  render: () => (
    <Indicator overlay={<span className="status-dot" />} placement="bottom-end">
      <Avatar src="/user.jpg" />
    </Indicator>
  ),
}

export const BottomStartPlacement: Story = {
  name: 'Bottom-start placement',
  render: () => (
    <Indicator overlay={<Badge variant="destructive">!</Badge>} placement="bottom-start">
      <Card>Content</Card>
    </Indicator>
  ),
}
