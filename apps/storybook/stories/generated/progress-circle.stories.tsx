// AUTO-GENERATED — do not edit; run `pnpm stories:generate`.
import type { Meta, StoryObj } from '@storybook/react-vite'
import { ProgressCircle } from '@cascivo/react'

const meta: Meta = {
  title: 'Feedback/ProgressCircle',
}
export default meta
type Story = StoryObj

export const Default: Story = {
  name: 'Default',
  render: () => <ProgressCircle value={40} label="Loading" />,
}

export const WithValue: Story = {
  name: 'With value',
  render: () => <ProgressCircle value={72} showValue size="lg" label="Upload progress" />,
}

export const CustomMax: Story = {
  name: 'Custom max',
  render: () => <ProgressCircle value={3} max={8} label="Steps completed" />,
}
