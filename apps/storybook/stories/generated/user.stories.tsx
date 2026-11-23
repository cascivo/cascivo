// AUTO-GENERATED — do not edit; run `pnpm stories:generate`.
import type { Meta, StoryObj } from '@storybook/react-vite'
import { User } from '@cascivo/react'

const meta: Meta = {
  title: 'Display/User',
}
export default meta
type Story = StoryObj

export const Basic: Story = {
  name: 'Basic',
  render: () => (
    <User
      name="Jane Doe"
      description="jane@acme.com"
      avatarProps={{ src: '/jane.jpg', alt: 'Jane Doe' }}
    />
  ),
}
