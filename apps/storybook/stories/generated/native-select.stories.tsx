// AUTO-GENERATED — do not edit; run `pnpm stories:generate`.
import type { Meta, StoryObj } from '@storybook/react-vite'
import { NativeSelect } from '@cascivo/react'

const meta: Meta = {
  title: 'Inputs/NativeSelect',
}
export default meta
type Story = StoryObj

export const OptionChildren: Story = {
  name: 'Option children',
  render: () => (
    <NativeSelect size="sm" defaultValue="light" aria-label="Theme">
      <option value="light">Light</option>
      <option value="dark">Dark</option>
    </NativeSelect>
  ),
}
