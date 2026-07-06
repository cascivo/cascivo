// AUTO-GENERATED — do not edit; run `pnpm stories:generate`.
import type { Meta, StoryObj } from '@storybook/react-vite'
import { Button, Input, Join } from '@cascivo/react'

const meta: Meta = {
  title: "Layout/Join",
}
export default meta
type Story = StoryObj

export const SearchGroup: Story = {
  name: "Search group",
  render: () => (
    <Join><Input placeholder="Search…" /><Button>Go</Button></Join>
  ),
}

export const SegmentedButtons: Story = {
  name: "Segmented buttons",
  render: () => (
    <Join><Button variant="secondary">Day</Button><Button variant="secondary">Week</Button><Button variant="secondary">Month</Button></Join>
  ),
}

export const VerticalStack: Story = {
  name: "Vertical stack",
  render: () => (
    <Join orientation="vertical"><Button>Top</Button><Button>Middle</Button><Button>Bottom</Button></Join>
  ),
}

