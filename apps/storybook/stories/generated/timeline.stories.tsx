// AUTO-GENERATED — do not edit; run `pnpm stories:generate`.
import type { Meta, StoryObj } from '@storybook/react-vite'
import { Timeline } from '@cascivo/react'

const meta: Meta = {
  title: "Display/Timeline",
}
export default meta
type Story = StoryObj

export const VerticalTimelineWithStatuses: Story = {
  name: "Vertical timeline with statuses",
  render: () => (
    <Timeline
      items={[
        { id: '1', title: 'Order placed', time: '09:00', status: 'complete' },
        { id: '2', title: 'Shipped', time: '12:30', status: 'current' },
        { id: '3', title: 'Delivered', status: 'upcoming' },
      ]}
    />
  ),
}

