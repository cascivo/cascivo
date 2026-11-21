// AUTO-GENERATED — do not edit; run `pnpm stories:generate`.
import type { Meta, StoryObj } from '@storybook/react-vite'
import { LargeTitleHeader, List, ListItem } from '@cascivo/react'

const meta: Meta = {
  title: 'Navigation/LargeTitleHeader',
}
export default meta
type Story = StoryObj

export const Basic: Story = {
  name: 'Basic',
  render: () => (
    <LargeTitleHeader title="Library">
      <List>
        <ListItem>Recently Added</ListItem>
        <ListItem>Artists</ListItem>
        <ListItem>Albums</ListItem>
      </List>
    </LargeTitleHeader>
  ),
}
