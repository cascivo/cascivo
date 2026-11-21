// AUTO-GENERATED — do not edit; run `pnpm stories:generate`.
import type { Meta, StoryObj } from '@storybook/react-vite'
import { ContainedList, ContainedListItem } from '@cascivo/react'

const meta: Meta = {
  title: "Display/ContainedList",
}
export default meta
type Story = StoryObj

export const BasicContainedList: Story = {
  name: "Basic contained list",
  render: () => (
    <ContainedList label="Members">
      <ContainedListItem>Ada Lovelace</ContainedListItem>
      <ContainedListItem>Alan Turing</ContainedListItem>
    </ContainedList>
  ),
}

