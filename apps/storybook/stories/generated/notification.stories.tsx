// AUTO-GENERATED — do not edit; run `pnpm stories:generate`.
import type { Meta, StoryObj } from '@storybook/react-vite'
import { Notification } from '@cascivo/react'

const meta: Meta = {
  title: 'Feedback/Notification',
}
export default meta
type Story = StoryObj

export const Info: Story = {
  name: 'Info',
  render: () => (
    <Notification variant="info" title="Sync complete" description="Your files are up to date." />
  ),
}
