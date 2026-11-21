// AUTO-GENERATED — do not edit; run `pnpm stories:generate`.
import type { Meta, StoryObj } from '@storybook/react-vite'
import { AspectRatio } from '@cascivo/react'

const meta: Meta = {
  title: "Layout/AspectRatio",
}
export default meta
type Story = StoryObj

export const ImageAt169: Story = {
  name: "Image at 16:9",
  render: () => (
    <AspectRatio ratio={16 / 9}>
      <img src="/cover.jpg" alt="Cover" />
    </AspectRatio>
  ),
}

export const Square: Story = {
  name: "Square",
  render: () => (
    <AspectRatio ratio={1}>
      <img src="/avatar.jpg" alt="Avatar" />
    </AspectRatio>
  ),
}

