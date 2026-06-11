import type { Meta, StoryObj } from '@storybook/react-vite'
import { Skeleton } from '@cascade-ui/components/skeleton'

const meta: Meta<typeof Skeleton> = {
  title: 'Display/Skeleton',
  component: Skeleton,
}
export default meta
type Story = StoryObj<typeof Skeleton>

export const Text: Story = {}
export const MultiLine: Story = { args: { lines: 3 } }
export const Circle: Story = { args: { variant: 'circle' } }
export const Rect: Story = { args: { variant: 'rect', height: '8rem' } }
export const CustomSize: Story = { args: { variant: 'rect', width: '200px', height: '4rem' } }

export const CardPlaceholder: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start', width: 320 }}>
      <Skeleton variant="circle" />
      <div style={{ flex: 1 }}>
        <Skeleton lines={3} />
      </div>
    </div>
  ),
}

export const Accessibility: Story = {
  args: { lines: 2 },
  parameters: {
    a11y: { test: 'error' },
  },
}
