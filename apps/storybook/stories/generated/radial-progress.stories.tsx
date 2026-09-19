// AUTO-GENERATED — do not edit; run `pnpm stories:generate`.
import type { Meta, StoryObj } from '@storybook/react-vite'
import { RadialProgress } from '@cascivo/react'

const meta: Meta = {
  title: 'Feedback/RadialProgress',
}
export default meta
type Story = StoryObj

export const Default: Story = {
  name: 'Default',
  render: () => <RadialProgress value={72} />,
}

export const SuccessLarge: Story = {
  name: 'Success large',
  render: () => <RadialProgress value={100} size="lg" variant="success" />,
}

export const CustomLabel: Story = {
  name: 'Custom label',
  render: () => (
    <RadialProgress value={45} variant="warning">
      45 GB
    </RadialProgress>
  ),
}
