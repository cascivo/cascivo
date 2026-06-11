import type { Meta, StoryObj } from '@storybook/react-vite'
import { NumberInput } from '@cascade-ui/components/number-input'

const meta: Meta<typeof NumberInput> = {
  title: 'Inputs/NumberInput',
  component: NumberInput,
  args: {
    label: 'Quantity',
    defaultValue: 5,
    onChange: () => {},
  },
}
export default meta
type Story = StoryObj<typeof NumberInput>

export const Default: Story = {}

export const WithMinMax: Story = {
  args: { min: 0, max: 10, label: 'Bounded (0–10)' },
}

export const WithStep: Story = {
  args: { step: 5, label: 'Step by 5' },
}

export const WithPrecision: Story = {
  args: { defaultValue: 9.99, step: 0.01, precision: 2, label: 'Price', hint: 'USD' },
}

export const WithHint: Story = {
  args: { hint: 'Enter a whole number between 1 and 100', min: 1, max: 100 },
}

export const WithError: Story = {
  args: { defaultValue: -1, error: 'Must be a positive number' },
}

export const Disabled: Story = {
  args: { disabled: true },
}

export const AllSizes: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 280 }}>
      <NumberInput size="sm" label="Small" defaultValue={1} />
      <NumberInput size="md" label="Medium" defaultValue={1} />
      <NumberInput size="lg" label="Large" defaultValue={1} />
    </div>
  ),
}

export const Accessibility: Story = {
  args: { min: 0, max: 100, defaultValue: 42, hint: 'Value between 0 and 100' },
  parameters: { a11y: { test: 'error' } },
}
