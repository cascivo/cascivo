// AUTO-GENERATED — do not edit; run `pnpm stories:generate`.
import type { Meta, StoryObj } from '@storybook/react-vite'
import { Label } from '@cascivo/react'

const meta: Meta = {
  title: "Inputs/Label",
}
export default meta
type Story = StoryObj

export const Basic: Story = {
  name: "Basic",
  render: () => (
    <Label htmlFor="email">Email</Label>
  ),
}

export const Required: Story = {
  name: "Required",
  render: () => (
    <Label htmlFor="email" required>Email</Label>
  ),
}

export const AsChild: Story = {
  name: "asChild",
  render: () => (
    <Label asChild htmlFor="email"><span>Email</span></Label>
  ),
}

