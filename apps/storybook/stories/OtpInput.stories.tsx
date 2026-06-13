import type { Meta, StoryObj } from '@storybook/react-vite'
import { OtpInput } from '@cascivo/components/otp-input'

const meta: Meta<typeof OtpInput> = {
  title: 'Inputs/OtpInput',
  component: OtpInput,
  args: { value: '', onValueChange: () => {} },
}
export default meta
type Story = StoryObj<typeof OtpInput>

export const Default: Story = {}
export const FourDigit: Story = { args: { length: 4 } }
export const Alphanumeric: Story = { args: { type: 'alphanumeric', length: 6 } }
export const Prefilled: Story = { args: { value: '123456' } }
export const Disabled: Story = { args: { value: '123', disabled: true } }

export const Accessibility: Story = {
  args: { length: 6, value: '' },
  parameters: { a11y: { test: 'error' } },
}
