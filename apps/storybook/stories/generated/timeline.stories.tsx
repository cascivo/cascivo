// AUTO-GENERATED — do not edit; run `pnpm stories:generate`.
import type { Meta, StoryObj } from '@storybook/react-vite'
import { Timeline } from '@cascivo/react'

const meta: Meta = {
  title: 'Display/Timeline',
}
export default meta
type Story = StoryObj

export const VerticalTimelineWithStatuses: Story = {
  name: 'Vertical timeline with statuses',
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

export const ActivityFeedColouredByEntryType: Story = {
  name: 'Activity feed coloured by entry type',
  render: () => (
    <Timeline
      items={[
        {
          id: '1',
          title: 'p99 latency 4.2s',
          description: 'ALERT · monitor',
          time: '14:28',
          tone: 'danger',
        },
        {
          id: '2',
          title: 'Rolling back deploy 4821',
          description: 'NOTE · bo',
          time: '14:49',
          tone: 'neutral',
        },
        {
          id: '3',
          title: 'Status changed to monitoring',
          description: 'STATUS · ana',
          time: '15:12',
          tone: 'info',
        },
        {
          id: '4',
          title: 'Merged 2 edits from kim',
          description: 'MERGE · sync',
          time: '15:14',
          tone: 'success',
        },
      ]}
    />
  ),
}
