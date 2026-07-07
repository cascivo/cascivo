// AUTO-GENERATED — do not edit; run `pnpm stories:generate`.
import type { Meta, StoryObj } from '@storybook/react-vite'
import { TreeView } from '@cascivo/react'

const meta: Meta = {
  title: 'Display/TreeView',
}
export default meta
type Story = StoryObj

export const SingleSelect: Story = {
  name: 'Single select',
  render: () => (
    <TreeView
      defaultExpanded={['src']}
      items={[{ id: 'src', label: 'src', children: [{ id: 'index', label: 'index.ts' }] }]}
    />
  ),
}
