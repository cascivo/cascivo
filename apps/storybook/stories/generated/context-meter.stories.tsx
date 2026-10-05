// AUTO-GENERATED — do not edit; run `pnpm stories:generate`.
import type { Meta, StoryObj } from '@storybook/react-vite'
import { ContextMeter } from '@cascivo/react'

const meta: Meta = {
  title: 'Feedback/ContextMeter',
}
export default meta
type Story = StoryObj

export const PlentyLeft: Story = {
  name: 'Plenty left',
  render: () => <ContextMeter value={12400} max={200000} />,
}

export const NearlyFull: Story = {
  name: 'Nearly full',
  render: () => <ContextMeter value={192000} max={200000} />,
}
