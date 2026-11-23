// AUTO-GENERATED — do not edit; run `pnpm stories:generate`.
import type { Meta, StoryObj } from '@storybook/react-vite'
import { Sources } from '@cascivo/react'

const meta: Meta = {
  title: 'Display/Sources',
}
export default meta
type Story = StoryObj

export const AnswerSources: Story = {
  name: 'Answer sources',
  render: () => (
    <Sources
      items={[
        { title: 'Refund policy', url: 'https://example.com/refunds' },
        {
          title: 'Terms of service',
          url: 'https://example.com/terms',
          description: '§4 covers cancellations.',
        },
      ]}
    />
  ),
}
