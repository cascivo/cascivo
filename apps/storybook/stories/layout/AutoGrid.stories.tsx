import type { Meta, StoryObj } from '@storybook/react-vite'
import { AutoGrid } from '@cascade-ui/layouts/auto-grid'

const meta: Meta<typeof AutoGrid> = {
  title: 'Layout/AutoGrid',
  component: AutoGrid,
  parameters: { layout: 'padded' },
}
export default meta
type Story = StoryObj<typeof AutoGrid>

const tile = (label: string) => (
  <div
    style={{
      height: '4rem',
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

export const Default: Story = {
  render: () => (
    <AutoGrid min="8rem" gap={3}>
      {[1, 2, 3, 4, 5, 6].map((n) => tile(`Item ${n}`))}
    </AutoGrid>
  ),
}

export const WideMin: Story = {
  render: () => (
    <AutoGrid min="16rem" gap={4}>
      {[1, 2, 3, 4].map((n) => tile(`Card ${n}`))}
    </AutoGrid>
  ),
}

export const NarrowMin: Story = {
  render: () => (
    <AutoGrid min="6rem" gap={2}>
      {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => tile(`${n}`))}
    </AutoGrid>
  ),
}
