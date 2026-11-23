// AUTO-GENERATED — do not edit; run `pnpm stories:generate`.
import type { Meta, StoryObj } from '@storybook/react-vite'
import { VirtualList } from '@cascivo/react'

const meta: Meta = {
  title: 'Display/VirtualList',
}
export default meta
type Story = StoryObj

export const Basic: Story = {
  name: 'Basic',
  render: () => (
    <VirtualList
      items={Array.from({ length: 10000 }, (_, i) => i)}
      itemHeight={40}
      height={320}
      ariaLabel="Results"
      renderItem={(n) => <span>Row {n + 1}</span>}
    />
  ),
}
