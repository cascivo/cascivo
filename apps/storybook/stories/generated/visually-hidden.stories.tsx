// AUTO-GENERATED — do not edit; run `pnpm stories:generate`.
import type { Meta, StoryObj } from '@storybook/react-vite'
import { VisuallyHidden } from '@cascivo/react'

const meta: Meta = {
  title: "Display/VisuallyHidden",
}
export default meta
type Story = StoryObj

export const TableContext: Story = {
  name: "Table context",
  render: () => (
    <th>Price <VisuallyHidden>(in euros)</VisuallyHidden></th>
  ),
}

