import type { Meta, StoryObj } from '@storybook/react-vite'
import { TimePicker } from '@cascivo/components/time-picker'

const meta: Meta<typeof TimePicker> = {
  title: 'Inputs/TimePicker',
  component: TimePicker,
  args: { label: 'Time' },
}
export default meta
type Story = StoryObj<typeof TimePicker>

export const Primary: Story = {}

export const Default: Story = {}
export const WithValue: Story = { args: { defaultValue: '09:30' } }
export const WithHint: Story = { args: { hint: 'Use 24h format', defaultValue: '14:00' } }
export const WithError: Story = { args: { error: 'Please enter a time', defaultValue: '25:00' } }
export const SizeSm: Story = { args: { size: 'sm' } }
export const SizeLg: Story = { args: { size: 'lg' } }
export const Disabled: Story = { args: { disabled: true, defaultValue: '10:00' } }
export const WithMinMax: Story = { args: { min: '08:00', max: '18:00', defaultValue: '09:00' } }
export const Accessibility: Story = { parameters: { a11y: { test: 'error' } } }
