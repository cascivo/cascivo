// AUTO-GENERATED — do not edit; run `pnpm stories:generate`.
import type { Meta, StoryObj } from '@storybook/react-vite'
import { DataList } from '@cascivo/react'

const meta: Meta = {
  title: 'Display/DataList',
}
export default meta
type Story = StoryObj

export const HorizontalDataList: Story = {
  name: 'Horizontal data list',
  render: () => (
    <DataList
      items={[
        { label: 'Name', value: 'Ada Lovelace' },
        { label: 'Role', value: 'Mathematician' },
      ]}
    />
  ),
}

export const VerticalWithDividers: Story = {
  name: 'Vertical with dividers',
  render: () => (
    <DataList
      orientation="vertical"
      dividers
      items={[{ label: 'Email', value: 'ada@example.com' }]}
    />
  ),
}
