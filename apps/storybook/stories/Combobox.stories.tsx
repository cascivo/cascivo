import type { Meta, StoryObj } from '@storybook/react-vite'
import { Combobox } from '@cascade-ui/components/combobox'

const options = [
  { value: 'us', label: 'United States' },
  { value: 'de', label: 'Germany' },
  { value: 'fr', label: 'France' },
  { value: 'jp', label: 'Japan' },
  { value: 'br', label: 'Brazil', disabled: true },
]

const meta: Meta<typeof Combobox> = {
  component: Combobox,
  args: { options, label: 'Country' },
}
export default meta
type Story = StoryObj<typeof Combobox>

export const Default: Story = {}
export const WithValue: Story = { args: { value: 'de' } }
export const Clearable: Story = { args: { value: 'fr', clearable: true } }
export const NotSearchable: Story = { args: { searchable: false } }
export const SizeSm: Story = { args: { size: 'sm' } }
export const SizeLg: Story = { args: { size: 'lg' } }
export const WithError: Story = { args: { error: 'Please select a country' } }
export const WithHint: Story = { args: { hint: 'Where are you based?' } }
export const Disabled: Story = { args: { disabled: true, value: 'us' } }
export const Accessibility: Story = { parameters: { a11y: { test: 'error' } } }
