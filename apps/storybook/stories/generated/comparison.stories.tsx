// AUTO-GENERATED — do not edit; run `pnpm stories:generate`.
import type { Meta, StoryObj } from '@storybook/react-vite'
import { Comparison } from '@cascivo/react'

const meta: Meta = {
  title: "Display/Comparison",
}
export default meta
type Story = StoryObj

export const ImageBeforeAfter: Story = {
  name: "Image before/after",
  render: () => (
    <Comparison before={<img src="/edited.jpg" alt="" />} after={<img src="/original.jpg" alt="Original" />} label="Reveal edited image" />
  ),
}

