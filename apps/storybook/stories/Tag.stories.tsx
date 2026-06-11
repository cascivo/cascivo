import type { Meta, StoryObj } from '@storybook/react-vite'
import { Tag } from '@cascade-ui/components/tag'

const meta: Meta<typeof Tag> = {
  title: 'Display/Tag',
  component: Tag,
  args: { children: 'Tag' },
}
export default meta
type Story = StoryObj<typeof Tag>

export const Default: Story = {}
export const Info: Story = { args: { variant: 'info', children: 'Info' } }
export const Success: Story = { args: { variant: 'success', children: 'Success' } }
export const Warning: Story = { args: { variant: 'warning', children: 'Warning' } }
export const Error: Story = { args: { variant: 'error', children: 'Error' } }

export const Dismissible: Story = {
  args: { children: 'Filter: Active', onDismiss: () => {} },
}

export const CustomDismissLabel: Story = {
  args: { children: 'Beta', onDismiss: () => {}, dismissLabel: 'Remove Beta tag' },
}

export const AllSizes: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
      <Tag size="sm">Sm</Tag>
      <Tag size="md">Md</Tag>
    </div>
  ),
}

export const Accessibility: Story = {
  args: { children: 'Design system', onDismiss: () => {} },
  parameters: {
    a11y: { test: 'error' },
  },
}
