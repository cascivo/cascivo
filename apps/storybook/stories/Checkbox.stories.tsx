import type { Meta, StoryObj } from '@storybook/react-vite'
import { Checkbox } from '@cascivo/components/checkbox'

const meta: Meta<typeof Checkbox> = {
  title: 'Inputs/Checkbox',
  component: Checkbox,
  args: { label: 'Email notifications' },
}
export default meta
type Story = StoryObj<typeof Checkbox>

export const Default: Story = {}
export const Checked: Story = { args: { defaultChecked: true } }
export const Indeterminate: Story = { args: { label: 'Select all', indeterminate: true } }
export const Disabled: Story = { args: { disabled: true } }
export const DisabledChecked: Story = { args: { disabled: true, defaultChecked: true } }

export const Group: Story = {
  render: () => (
    <div style={{ display: 'grid', gap: 8 }}>
      <Checkbox label="Email notifications" defaultChecked />
      <Checkbox label="SMS notifications" />
      <Checkbox label="Push notifications" />
    </div>
  ),
}

export const Accessibility: Story = {
  args: { label: 'I agree to the terms' },
  parameters: { a11y: { test: 'error' } },
}
