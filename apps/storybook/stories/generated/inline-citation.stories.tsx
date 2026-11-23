// AUTO-GENERATED — do not edit; run `pnpm stories:generate`.
import type { Meta, StoryObj } from '@storybook/react-vite'
import { InlineCitation } from '@cascivo/react'

const meta: Meta = {
  title: 'Display/InlineCitation',
}
export default meta
type Story = StoryObj

export const InASentence: Story = {
  name: 'In a sentence',
  render: () => (
    <p>
      Refunds are available for 30 days.
      <InlineCitation
        index={1}
        source={{ title: 'Refund policy', url: 'https://example.com/refunds' }}
      />
    </p>
  ),
}
