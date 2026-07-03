// AUTO-GENERATED — do not edit; run `pnpm stories:generate`.
import type { Meta, StoryObj } from '@storybook/react-vite'
import { Image } from '@cascivo/react'

const meta: Meta = {
  title: 'Display/Image',
}
export default meta
type Story = StoryObj

export const Basic: Story = {
  name: 'Basic',
  render: () => <Image src="/photo.jpg" alt="A photo" width={320} height={240} />,
}

export const WithFallback: Story = {
  name: 'With fallback',
  render: () => <Image src="/broken.jpg" fallbackSrc="/placeholder.jpg" alt="A photo" />,
}

export const BlurredPlaceholder: Story = {
  name: 'Blurred placeholder',
  render: () => <Image src="/photo.jpg" alt="A photo" isBlurred />,
}

export const HoverZoom: Story = {
  name: 'Hover zoom',
  render: () => <Image src="/photo.jpg" alt="A photo" zoom />,
}
