import type { Meta, StoryObj } from '@storybook/react-vite'
import { Input } from '@cascivo/components/input'

const meta: Meta<typeof Input> = {
  title: 'Inputs/Input',
  component: Input,
  args: { label: 'Email address', placeholder: 'you@example.com' },
}
export default meta
type Story = StoryObj<typeof Input>

export const Primary: Story = {}

export const Default: Story = {}
export const WithHint: Story = {
  args: { label: 'Username', hint: 'Must be 3–20 characters' },
}
export const WithError: Story = {
  args: { label: 'Email', error: 'Invalid email address', defaultValue: 'not-an-email' },
}
export const Disabled: Story = { args: { disabled: true } }

export const AllSizes: Story = {
  render: () => (
    <div style={{ display: 'grid', gap: 12, maxWidth: 320 }}>
      <Input label="Small" size="sm" placeholder="sm" />
      <Input label="Medium" size="md" placeholder="md" />
      <Input label="Large" size="lg" placeholder="lg" />
    </div>
  ),
}

export const Accessibility: Story = {
  args: { label: 'Full name', hint: 'As shown on your ID' },
  parameters: { a11y: { test: 'error' } },
}
