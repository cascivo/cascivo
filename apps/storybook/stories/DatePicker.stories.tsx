import type { Meta, StoryObj } from '@storybook/react-vite'
import { DatePicker } from '@cascivo/components/date-picker'

const meta: Meta<typeof DatePicker> = {
  title: 'Inputs/DatePicker',
  component: DatePicker,
  args: { label: 'Date' },
}
export default meta
type Story = StoryObj<typeof DatePicker>

export const Default: Story = {}
export const WithValue: Story = { args: { defaultValue: '2024-06-15' } }
export const Clearable: Story = { args: { defaultValue: '2024-06-15', clearable: true } }
export const WithMin: Story = { args: { min: '2024-06-01', max: '2024-06-30' } }
export const SizeSm: Story = { args: { size: 'sm' } }
export const SizeLg: Story = { args: { size: 'lg' } }
export const WithError: Story = { args: { error: 'Please select a date' } }
export const WithHint: Story = { args: { hint: 'Select a future date' } }
export const Disabled: Story = { args: { disabled: true, defaultValue: '2024-01-01' } }
export const Accessibility: Story = { parameters: { a11y: { test: 'error' } } }
