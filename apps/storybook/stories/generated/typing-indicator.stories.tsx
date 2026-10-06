// AUTO-GENERATED — do not edit; run `pnpm stories:generate`.
import type { Meta, StoryObj } from '@storybook/react-vite'
import { ChatBubble, TypingIndicator } from '@cascivo/react'

const meta: Meta = {
  title: 'Feedback/TypingIndicator',
}
export default meta
type Story = StoryObj

export const Default: Story = {
  name: 'Default',
  render: () => <TypingIndicator />,
}

export const InAChatBubble: Story = {
  name: 'In a chat bubble',
  render: () => (
    <ChatBubble name="Assistant">
      <TypingIndicator />
    </ChatBubble>
  ),
}

export const APersonTyping: Story = {
  name: 'A person typing',
  render: () => <TypingIndicator ariaLabel="Ada is typing" />,
}
