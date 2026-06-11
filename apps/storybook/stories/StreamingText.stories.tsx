import type { Meta, StoryObj } from '@storybook/react-vite'
import { StreamingText } from '@cascade-ui/ai'

const meta: Meta<typeof StreamingText> = {
  component: StreamingText,
  args: { text: 'Hello, I am cascade AI.' },
}
export default meta
type Story = StoryObj<typeof StreamingText>

export const Default: Story = {}
export const Fast: Story = { args: { speed: 5 } }
export const Slow: Story = { args: { speed: 1 } }
