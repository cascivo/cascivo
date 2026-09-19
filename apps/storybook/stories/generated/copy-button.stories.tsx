// AUTO-GENERATED — do not edit; run `pnpm stories:generate`.
import type { Meta, StoryObj } from '@storybook/react-vite'
import { CopyButton } from '@cascivo/react'

const meta: Meta = {
  title: "Inputs/CopyButton",
}
export default meta
type Story = StoryObj

export const Default: Story = {
  name: "Default",
  render: () => (
    <CopyButton value="npx cascivo add button" />
  ),
}

export const Small: Story = {
  name: "Small",
  render: () => (
    <CopyButton value="pnpm install" size="sm" />
  ),
}

export const CustomLabels: Story = {
  name: "Custom labels",
  render: () => (
    <CopyButton value="token" labels={{ copy: 'Copy token', copied: 'Token copied' }} />
  ),
}

