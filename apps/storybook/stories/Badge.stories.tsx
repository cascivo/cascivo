import type { Meta, StoryObj } from '@storybook/react-vite'
import { Badge } from '@cascivo/components/badge'

const meta: Meta<typeof Badge> = {
  title: 'Display/Badge',
  component: Badge,
  args: { children: 'Badge' },
}
export default meta
type Story = StoryObj<typeof Badge>

export const Default: Story = { args: { children: 'New' } }
export const Secondary: Story = { args: { variant: 'secondary', children: 'Draft' } }
export const Success: Story = { args: { variant: 'success', children: 'Active' } }
export const Warning: Story = { args: { variant: 'warning', children: 'Pending' } }
export const Destructive: Story = { args: { variant: 'destructive', children: 'Deprecated' } }
export const Outline: Story = { args: { variant: 'outline', children: 'Beta' } }

export const AllSizes: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
      <Badge size="sm">Small</Badge>
      <Badge size="md">Medium</Badge>
    </div>
  ),
}

export const Accessibility: Story = {
  args: { variant: 'success', children: 'Live' },
  parameters: { a11y: { test: 'error' } },
}
