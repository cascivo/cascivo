import type { Meta, StoryObj } from '@storybook/react-vite'
import { AiLabel } from '@cascivo/ai'

const meta: Meta<typeof AiLabel> = {
  title: 'AI/AiLabel',
  component: AiLabel,
  args: { variant: 'generating' },
}
export default meta
type Story = StoryObj<typeof AiLabel>

export const Primary: Story = {}

export const Generating: Story = {}
export const Done: Story = { args: { variant: 'done' } }
export const Error: Story = { args: { variant: 'error' } }
