import type { Meta, StoryObj } from '@storybook/react-vite'
import { AiChat } from '@cascivo/ai'

const meta: Meta<typeof AiChat> = {
  title: 'AI/AiChat',
  component: AiChat,
  parameters: { layout: 'fullscreen' },
  args: {
    messages: [
      { id: '1', role: 'user', content: 'How do I add a Button?' },
      { id: '2', role: 'assistant', content: 'Run: npx cascade add button' },
    ],
    onSend: () => {},
  },
}
export default meta
type Story = StoryObj<typeof AiChat>

export const Default: Story = {}
export const Streaming: Story = {
  args: { isStreaming: true, streamingText: 'Generating response…' },
}
export const Empty: Story = { args: { messages: [] } }
