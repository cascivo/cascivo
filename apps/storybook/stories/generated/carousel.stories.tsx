// AUTO-GENERATED — do not edit; run `pnpm stories:generate`.
import type { Meta, StoryObj } from '@storybook/react-vite'
import { Carousel } from '@cascivo/react'

const meta: Meta = {
  title: "Display/Carousel",
}
export default meta
type Story = StoryObj

export const Basic: Story = {
  name: "Basic",
  render: () => (
    <Carousel>
      <img src="/1.jpg" alt="" />
      <img src="/2.jpg" alt="" />
    </Carousel>
  ),
}

