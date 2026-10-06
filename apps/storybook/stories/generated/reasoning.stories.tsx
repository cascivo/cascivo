// AUTO-GENERATED — do not edit; run `pnpm stories:generate`.
import type { Meta, StoryObj } from '@storybook/react-vite'
import { Reasoning } from '@cascivo/react'

const meta: Meta = {
  title: 'Display/Reasoning',
}
export default meta
type Story = StoryObj

export const Streaming: Story = {
  name: 'Streaming',
  render: () => (
    <Reasoning streaming>The user wants a summary, so I will start with the totals…</Reasoning>
  ),
}

export const Settled: Story = {
  name: 'Settled',
  render: () => (
    <Reasoning duration={12}>
      The user wants a summary, so I started with the totals and then compared regions.
    </Reasoning>
  ),
}
