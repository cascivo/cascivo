// AUTO-GENERATED — do not edit; run `pnpm stories:generate`.
import type { Meta, StoryObj } from '@storybook/react-vite'
import { StructuredList } from '@cascivo/react'

const meta: Meta = {
  title: 'Display/StructuredList',
}
export default meta
type Story = StoryObj

export const Static: Story = {
  name: 'Static',
  render: () => (
    <StructuredList headers={['Name', 'Role']} items={[{ id: 'a', cells: ['Ada', 'Engineer'] }]} />
  ),
}
