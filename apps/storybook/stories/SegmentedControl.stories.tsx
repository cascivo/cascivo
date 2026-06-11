import type { Meta, StoryObj } from '@storybook/react-vite'
import { SegmentedControl } from '@cascade-ui/components/segmented-control'

const options = [
  { label: 'Day', value: 'day' },
  { label: 'Week', value: 'week' },
  { label: 'Month', value: 'month' },
]

const meta: Meta<typeof SegmentedControl> = {
  title: 'Inputs/SegmentedControl',
  component: SegmentedControl,
  args: { options, value: 'day', onValueChange: () => {} },
}
export default meta
type Story = StoryObj<typeof SegmentedControl>

export const Default: Story = {}
export const Small: Story = { args: { size: 'sm' } }
export const Large: Story = { args: { size: 'lg' } }
export const Disabled: Story = { args: { disabled: true } }

export const Accessibility: Story = {
  args: { value: 'week' },
  parameters: { a11y: { test: 'error' } },
}
