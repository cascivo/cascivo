import type { Meta, StoryObj } from '@storybook/react-vite'
import { Blockquote } from '@cascivo/components/blockquote'

const meta: Meta<typeof Blockquote> = {
  title: 'Display/Blockquote',
  component: Blockquote,
  args: { children: 'Less, but better.' },
}
export default meta
type Story = StoryObj<typeof Blockquote>

export const Primary: Story = {}

export const Default: Story = {}
export const WithAttribution: Story = { args: { cite: 'Dieter Rams' } }

export const Accessibility: Story = {
  args: { cite: 'Dieter Rams' },
  parameters: { a11y: { test: 'error' } },
}
