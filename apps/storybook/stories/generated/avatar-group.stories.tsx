// AUTO-GENERATED — do not edit; run `pnpm stories:generate`.
import type { Meta, StoryObj } from '@storybook/react-vite'
import { Avatar, AvatarGroup } from '@cascivo/react'

const meta: Meta = {
  title: 'Display/AvatarGroup',
}
export default meta
type Story = StoryObj

export const Basic: Story = {
  name: 'Basic',
  render: () => (
    <AvatarGroup>
      <Avatar fallback="A" />
      <Avatar fallback="B" />
      <Avatar fallback="C" />
    </AvatarGroup>
  ),
}
