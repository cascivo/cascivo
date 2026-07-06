// AUTO-GENERATED — do not edit; run `pnpm stories:generate`.
import type { Meta, StoryObj } from '@storybook/react-vite'
import { Menubar } from '@cascivo/react'

const meta: Meta = {
  title: "Navigation/Menubar",
}
export default meta
type Story = StoryObj

export const Basic: Story = {
  name: "Basic",
  render: () => (
    <Menubar aria-label="Main" menus={[{ id: "file", label: "File", items: [{ id: "new", label: "New", onSelect: () => {} }] }]} />
  ),
}

