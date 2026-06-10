import type { Meta, StoryObj } from '@storybook/react-vite'
import { OverflowMenu } from '@cascade-ui/components/overflow-menu'

const items = [
  { label: 'Edit', value: 'edit' },
  { label: 'Duplicate', value: 'duplicate' },
  { label: 'Archive', value: 'archive', disabled: true },
  { label: 'Delete', value: 'delete', destructive: true },
]

const meta: Meta<typeof OverflowMenu> = {
  component: OverflowMenu,
  args: { items },
}
export default meta
type Story = StoryObj<typeof OverflowMenu>

export const Default: Story = {}

export const Small: Story = { args: { size: 'sm' } }

export const Disabled: Story = { args: { disabled: true } }

export const StartPlacement: Story = { args: { placement: 'bottom-start' } }

export const CustomLabel: Story = { args: { ariaLabel: 'Row actions' } }

export const Accessibility: Story = {
  parameters: { a11y: { test: 'error' } },
}
