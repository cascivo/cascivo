// AUTO-GENERATED — do not edit; run `pnpm stories:generate`.
import type { Meta, StoryObj } from '@storybook/react-vite'
import { LogViewer } from '@cascivo/react'

const meta: Meta = {
  title: 'Display/LogViewer',
}
export default meta
type Story = StoryObj

export const StaticLogWithLevels: Story = {
  name: 'Static log with levels',
  render: () => (
    <LogViewer
      lines={[
        { id: 1, text: 'Build started', level: 'info' },
        { id: 2, text: 'Type error', level: 'error' },
      ]}
    />
  ),
}
