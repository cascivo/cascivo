// AUTO-GENERATED — do not edit; run `pnpm stories:generate`.
import type { Meta, StoryObj } from '@storybook/react-vite'
import { ShareMenu } from '@cascivo/react'

const meta: Meta = {
  title: 'Overlay/ShareMenu',
}
export default meta
type Story = StoryObj

export const Default: Story = {
  name: 'Default',
  render: () => <ShareMenu url="https://cascivo.com/blog/launch" text="cascivo 1.0 is out" />,
}
