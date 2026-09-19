// AUTO-GENERATED — do not edit; run `pnpm stories:generate`.
import type { Meta, StoryObj } from '@storybook/react-vite'
import { Collapsible } from '@cascivo/react'

const meta: Meta = {
  title: "Display/Collapsible",
}
export default meta
type Story = StoryObj

export const Uncontrolled: Story = {
  name: "Uncontrolled",
  render: () => (
    <Collapsible trigger="Show details">
      <p>Hidden content revealed on toggle.</p>
    </Collapsible>
  ),
}

export const OpenByDefault: Story = {
  name: "Open by default",
  render: () => (
    <Collapsible defaultOpen trigger="Details">
      <p>Visible initially.</p>
    </Collapsible>
  ),
}

