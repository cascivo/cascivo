import type { Meta, StoryObj } from '@storybook/react-vite'
import { Button } from '@cascivo/components/button'
import { EmptyState } from '@cascivo/components/empty-state'

const meta: Meta<typeof EmptyState> = {
  title: 'Display/EmptyState',
  component: EmptyState,
  args: { title: 'No results', description: 'Try adjusting your filters.' },
}
export default meta
type Story = StoryObj<typeof EmptyState>

export const Primary: Story = {}

export const Default: Story = {}
export const WithIcon: Story = {
  args: {
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2" />
        <path d="m16 16 5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      </svg>
    ),
  },
}
export const WithAction: Story = {
  args: {
    title: 'No documents yet',
    description: 'Create your first document to get started.',
    action: <Button>New document</Button>,
  },
}
export const Large: Story = {
  args: { size: 'lg', icon: '📄' },
}

export const Accessibility: Story = {
  args: {
    icon: '📄',
    title: 'No documents yet',
    description: 'Create your first document to get started.',
    action: <Button>New document</Button>,
  },
  parameters: { a11y: { test: 'error' } },
}
