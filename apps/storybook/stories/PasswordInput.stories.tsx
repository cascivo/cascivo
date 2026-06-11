import type { Meta, StoryObj } from '@storybook/react-vite'
import { PasswordInput } from '@cascade-ui/components/password-input'

const meta: Meta<typeof PasswordInput> = {
  title: 'Inputs/PasswordInput',
  component: PasswordInput,
  args: { placeholder: 'Enter password' },
}
export default meta
type Story = StoryObj<typeof PasswordInput>

export const Default: Story = {}

export const WithStrengthMeter: Story = {
  args: { showStrengthMeter: true, defaultValue: 'Abc123!@#xyz' },
}

export const SmallSize: Story = { args: { size: 'sm' } }
export const LargeSize: Story = { args: { size: 'lg' } }
export const Disabled: Story = { args: { disabled: true, defaultValue: 'password123' } }

export const Accessibility: Story = {
  args: { showStrengthMeter: true },
  parameters: { a11y: { test: 'error' } },
}
