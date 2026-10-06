// AUTO-GENERATED — do not edit; run `pnpm stories:generate`.
import type { Meta, StoryObj } from '@storybook/react-vite'
import { ShimmerText } from '@cascivo/react'

const meta: Meta = {
  title: 'Feedback/ShimmerText',
}
export default meta
type Story = StoryObj

export const ThinkingLabel: Story = {
  name: 'Thinking label',
  render: () => <ShimmerText>Thinking…</ShimmerText>,
}

export const AsAParagraph: Story = {
  name: 'As a paragraph',
  render: () => <ShimmerText as="p">Searching 12 documents…</ShimmerText>,
}
