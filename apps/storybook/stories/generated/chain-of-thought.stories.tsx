// AUTO-GENERATED — do not edit; run `pnpm stories:generate`.
import type { Meta, StoryObj } from '@storybook/react-vite'
import { ChainOfThought } from '@cascivo/react'

const meta: Meta = {
  title: 'Display/ChainOfThought',
}
export default meta
type Story = StoryObj

export const AgentSteps: Story = {
  name: 'Agent steps',
  render: () => (
    <ChainOfThought
      items={[
        { id: 'search', title: 'Searched the docs for "refund policy"', status: 'complete' },
        { id: 'read', title: 'Reading 3 pages', status: 'active' },
        { id: 'answer', title: 'Write the answer', status: 'pending' },
      ]}
    />
  ),
}

export const WithCollapsibleDetail: Story = {
  name: 'With collapsible detail',
  render: () => (
    <ChainOfThought
      items={[
        {
          id: 'search',
          title: 'Searched the web',
          status: 'complete',
          detail:
            'cascivo.com/docs · github.com/cascivo/cascivo · npmjs.com/package/@cascivo/react',
        },
        {
          id: 'fail',
          title: 'Fetch pricing page',
          description: 'The page returned 404.',
          status: 'error',
        },
      ]}
    />
  ),
}
