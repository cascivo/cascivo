// AUTO-GENERATED — do not edit; run `pnpm stories:generate`.
import type { Meta, StoryObj } from '@storybook/react-vite'
import { MessageActions } from '@cascivo/react'

const meta: Meta = {
  title: 'Inputs/MessageActions',
}
export default meta
type Story = StoryObj

export const CopyRateAndRegenerate: Story = {
  name: 'Copy, rate and regenerate',
  render: () => (
    <MessageActions
      copyValue="Refunds are available for 30 days."
      onFeedbackChange={() => {}}
      onRegenerate={() => {}}
    />
  ),
}

export const CopyOnly: Story = {
  name: 'Copy only',
  render: () => <MessageActions copyValue="Hello" />,
}
