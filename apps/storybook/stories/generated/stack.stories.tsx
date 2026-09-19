// AUTO-GENERATED — do not edit; run `pnpm stories:generate`.
import type { Meta, StoryObj } from '@storybook/react-vite'
import { Avatar, Card, Stack } from '@cascivo/react'

const meta: Meta = {
  title: 'Layout/Stack',
}
export default meta
type Story = StoryObj

export const CardPile: Story = {
  name: 'Card pile',
  render: () => (
    <Stack offset={6}>
      <Card>First</Card>
      <Card>Second</Card>
      <Card>Third</Card>
    </Stack>
  ),
}

export const TightStack: Story = {
  name: 'Tight stack',
  render: () => (
    <Stack offset={2}>
      <Avatar src="/a.jpg" />
      <Avatar src="/b.jpg" />
      <Avatar src="/c.jpg" />
    </Stack>
  ),
}
