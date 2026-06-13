import type { Meta, StoryObj } from '@storybook/react-vite'
import { MediaMasonry } from '@cascivo/layouts/sections/media-masonry'

const meta: Meta<typeof MediaMasonry> = {
  title: 'Sections/MediaMasonry',
  component: MediaMasonry,
  parameters: { layout: 'fullscreen' },
}
export default meta
type Story = StoryObj<typeof MediaMasonry>

const tile = (label: string, h: number) => (
  <div
    style={{
      height: `${h}px`,
      background: 'var(--cascivo-surface-subtle)',
      border: '1px solid var(--cascivo-color-border)',
      borderRadius: 'var(--cascivo-radius-md)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: '0.75rem',
    }}
  >
    {label}
  </div>
)

const heights = [120, 180, 90, 150, 80, 200, 100, 140, 110]

export const Default: Story = {
  render: () => (
    <MediaMasonry
      title="Customer stories"
      description="Teams shipping faster with Cascade."
      cols={3}
      gap={4}
    >
      {heights.map((h, i) => tile(`Story ${i + 1}`, h))}
    </MediaMasonry>
  ),
}

export const TwoColumns: Story = {
  render: () => (
    <MediaMasonry cols={2} gap={4}>
      {heights.slice(0, 6).map((h, i) => tile(`Tile ${i + 1}`, h))}
    </MediaMasonry>
  ),
}
