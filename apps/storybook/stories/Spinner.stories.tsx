import type { Meta, StoryObj } from '@storybook/react-vite'
import { Spinner } from '@cascivo/components/spinner'

const meta: Meta<typeof Spinner> = {
  title: 'Feedback/Spinner',
  component: Spinner,
}
export default meta
type Story = StoryObj<typeof Spinner>

export const Default: Story = {}
export const CustomLabel: Story = { args: { label: 'Loading results' } }

export const AllSizes: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
      <Spinner size="sm" />
      <Spinner size="md" />
      <Spinner size="lg" />
    </div>
  ),
}

export const Accessibility: Story = {
  args: { label: 'Loading dashboard' },
  parameters: { a11y: { test: 'error' } },
}
