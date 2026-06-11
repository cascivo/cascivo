import type { Meta, StoryObj } from '@storybook/react-vite'
import { Kbd } from '@cascade-ui/components/kbd'

const meta: Meta<typeof Kbd> = {
  title: 'Display/Kbd',
  component: Kbd,
  args: { children: 'K' },
}
export default meta
type Story = StoryObj<typeof Kbd>

export const Default: Story = {}
export const Symbol: Story = { args: { children: '⌘' } }
export const Word: Story = { args: { children: 'Esc' } }

export const Shortcut: Story = {
  render: () => (
    <span style={{ display: 'inline-flex', gap: 6, alignItems: 'center' }}>
      <Kbd>⌘</Kbd> + <Kbd>K</Kbd>
    </span>
  ),
}

export const AllSizes: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
      <Kbd size="sm">Esc</Kbd>
      <Kbd size="md">Esc</Kbd>
    </div>
  ),
}

export const Accessibility: Story = {
  args: { children: 'Enter' },
  parameters: { a11y: { test: 'error' } },
}
