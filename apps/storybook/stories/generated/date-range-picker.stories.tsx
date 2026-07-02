// AUTO-GENERATED — do not edit; run `pnpm stories:generate`.
import type { Meta, StoryObj } from '@storybook/react-vite'
import { DateRangePicker } from '@cascivo/react'

const meta: Meta = {
  title: 'Inputs/DateRangePicker',
}
export default meta
type Story = StoryObj

export const Basic: Story = {
  name: 'Basic',
  render: () => <DateRangePicker />,
}

export const Constrained: Story = {
  name: 'Constrained',
  render: () => (
    <DateRangePicker min={new Date(Date.UTC(2024, 0, 1))} max={new Date(Date.UTC(2024, 11, 31))} />
  ),
}
