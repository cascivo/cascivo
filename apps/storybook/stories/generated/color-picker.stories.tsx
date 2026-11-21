// AUTO-GENERATED — do not edit; run `pnpm stories:generate`.
import type { Meta, StoryObj } from '@storybook/react-vite'
import { ColorPicker } from '@cascivo/react'

const meta: Meta = {
  title: 'Inputs/ColorPicker',
}
export default meta
type Story = StoryObj

export const WithPresets: Story = {
  name: 'With presets',
  render: () => <ColorPicker presets={['#ef4444', '#3b82f6', '#10b981']} alpha={false} />,
}
