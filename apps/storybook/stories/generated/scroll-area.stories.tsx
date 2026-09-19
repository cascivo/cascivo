// AUTO-GENERATED — do not edit; run `pnpm stories:generate`.
import type { Meta, StoryObj } from '@storybook/react-vite'
import { ScrollArea } from '@cascivo/react'

const meta: Meta = {
  title: "Layout/ScrollArea",
}
export default meta
type Story = StoryObj

export const VerticalScroll: Story = {
  name: "Vertical scroll",
  render: () => (
    <ScrollArea height="12rem">
      <p>Long content…</p>
    </ScrollArea>
  ),
}

export const BothAxes: Story = {
  name: "Both axes",
  render: () => (
    <ScrollArea height="12rem" width="20rem" orientation="both">
      <table>…</table>
    </ScrollArea>
  ),
}

