import type { Meta, StoryObj } from '@storybook/react-vite'
import { Select } from '@cascivo/components/select'

const options = [
  { value: 'admin', label: 'Admin' },
  { value: 'editor', label: 'Editor' },
  { value: 'viewer', label: 'Viewer' },
  { value: 'guest', label: 'Guest', disabled: true },
]

const meta: Meta<typeof Select> = {
  title: 'Inputs/Select',
  component: Select,
  args: { label: 'Role', placeholder: 'Choose a role', options },
}
export default meta
type Story = StoryObj<typeof Select>

export const Default: Story = {}
export const WithHint: Story = { args: { hint: 'You can change this later' } }
export const WithError: Story = { args: { error: 'A role is required' } }
export const Disabled: Story = { args: { disabled: true } }

export const Accessibility: Story = {
  args: { label: 'Country', placeholder: 'Choose a country' },
  parameters: { a11y: { test: 'error' } },
}
