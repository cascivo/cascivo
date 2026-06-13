import type { Meta, StoryObj } from '@storybook/react-vite'
import { Textarea } from '@cascivo/components/textarea'

const meta: Meta<typeof Textarea> = {
  title: 'Inputs/Textarea',
  component: Textarea,
  args: { label: 'Message', placeholder: 'Tell us what you think…' },
}
export default meta
type Story = StoryObj<typeof Textarea>

export const Default: Story = {}
export const WithHint: Story = { args: { hint: 'Up to 500 characters' } }
export const WithError: Story = {
  args: { error: 'Message is required', defaultValue: '' },
}
export const Disabled: Story = { args: { disabled: true } }
export const FixedRows: Story = { args: { rows: 6 } }
export const NoResize: Story = { args: { resize: 'none' } }

export const Accessibility: Story = {
  args: { label: 'Feedback', hint: 'Be specific' },
  parameters: { a11y: { test: 'error' } },
}
