// AUTO-GENERATED — do not edit; run `pnpm stories:generate`.
import type { Meta, StoryObj } from '@storybook/react-vite'
import {
  Avatar,
  Button,
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemMedia,
  ItemTitle,
} from '@cascivo/react'

const meta: Meta = {
  title: 'Display/Item',
}
export default meta
type Story = StoryObj

export const ItemWithMediaContentAndActions: Story = {
  name: 'Item with media, content, and actions',
  render: () => (
    <Item>
      <ItemMedia>
        <Avatar />
      </ItemMedia>
      <ItemContent>
        <ItemTitle>Ada Lovelace</ItemTitle>
        <ItemDescription>Mathematician</ItemDescription>
      </ItemContent>
      <ItemActions>
        <Button size="sm">Edit</Button>
      </ItemActions>
    </Item>
  ),
}

export const AsALinkViaAsChild: Story = {
  name: 'As a link via asChild',
  render: () => (
    <Item asChild>
      <a href="/profile">
        <ItemContent>
          <ItemTitle>Profile</ItemTitle>
        </ItemContent>
      </a>
    </Item>
  ),
}
