import type { Meta, StoryObj } from '@storybook/react-vite'
import { Masonry } from '@cascade-ui/layouts/masonry'

const meta: Meta<typeof Masonry> = {
  title: 'Layout/Masonry',
  component: Masonry,
  parameters: { layout: 'padded' },
}
export default meta
type Story = StoryObj<typeof Masonry>

const tile = (label: string, h: number) => (
  <div
    style={{
      height: `${h}px`,
      background: 'var(--cascade-surface-subtle)',
      border: '1px solid var(--cascade-color-border)',
      borderRadius: 'var(--cascade-radius-md)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: '0.75rem',
    }}
  >
    {label}
  </div>
)

const heights = [120, 80, 160, 100, 60, 140, 90, 110, 75]

export const ThreeColumns: Story = {
  render: () => (
    <Masonry cols={3} gap={4}>
      {heights.map((h, i) => tile(`Tile ${i + 1}`, h))}
    </Masonry>
  ),
}

export const TwoColumns: Story = {
  render: () => (
    <Masonry cols={2} gap={4}>
      {heights.slice(0, 6).map((h, i) => tile(`Tile ${i + 1}`, h))}
    </Masonry>
  ),
}

export const FourColumns: Story = {
  render: () => (
    <Masonry cols={4} gap={3}>
      {heights.map((h, i) => tile(`Tile ${i + 1}`, h))}
    </Masonry>
  ),
}
