// AUTO-GENERATED — do not edit; run `pnpm stories:generate`.
import type { Meta, StoryObj } from '@storybook/react-vite'
import { Progress } from '@cascivo/react'

const meta: Meta = {
  title: 'Feedback/Progress',
}
export default meta
type Story = StoryObj

export const Determinate: Story = {
  name: 'Determinate',
  render: () => <Progress value={65} />,
}

export const Indeterminate: Story = {
  name: 'Indeterminate',
  render: () => <Progress aria-label="Loading…" />,
}

export const SuccessVariant: Story = {
  name: 'Success variant',
  render: () => <Progress value={100} variant="success" />,
}

export const Small: Story = {
  name: 'Small',
  render: () => <Progress value={40} size="sm" />,
}
