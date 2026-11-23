// AUTO-GENERATED — do not edit; run `pnpm stories:generate`.
import type { Meta, StoryObj } from '@storybook/react-vite'
import { InlineLoading } from '@cascivo/react'

const meta: Meta = {
  title: "Feedback/InlineLoading",
}
export default meta
type Story = StoryObj

export const Active: Story = {
  name: "Active",
  render: () => (
    <InlineLoading status="active" />
  ),
}

export const Finished: Story = {
  name: "Finished",
  render: () => (
    <InlineLoading status="finished" label="Saved" />
  ),
}

export const Error: Story = {
  name: "Error",
  render: () => (
    <InlineLoading status="error" label="Save failed" />
  ),
}

