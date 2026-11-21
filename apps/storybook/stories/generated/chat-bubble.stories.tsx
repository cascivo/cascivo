// AUTO-GENERATED — do not edit; run `pnpm stories:generate`.
import type { Meta, StoryObj } from '@storybook/react-vite'
import { Avatar, ChatBubble } from '@cascivo/react'

const meta: Meta = {
  title: 'Display/ChatBubble',
}
export default meta
type Story = StoryObj

export const IncomingMessage: Story = {
  name: 'Incoming message',
  render: () => (
    <ChatBubble side="start" name="Alice" time="10:42 AM">
      Hey, how are you?
    </ChatBubble>
  ),
}

export const OutgoingMessage: Story = {
  name: 'Outgoing message',
  render: () => (
    <ChatBubble side="end" time="10:43 AM">
      Doing great, thanks!
    </ChatBubble>
  ),
}

export const WithAvatar: Story = {
  name: 'With avatar',
  render: () => (
    <ChatBubble side="start" avatar={<Avatar src="/alice.png" size="sm" />} name="Alice">
      See you tomorrow!
    </ChatBubble>
  ),
}
