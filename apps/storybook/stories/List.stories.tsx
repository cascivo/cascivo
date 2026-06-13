import type { Meta, StoryObj } from '@storybook/react-vite'
import { List, ListItem } from '@cascivo/components/list'

const meta: Meta<typeof List> = {
  title: 'Display/List',
  component: List,
}
export default meta
type Story = StoryObj<typeof List>

export const Unordered: Story = {
  render: () => (
    <List>
      <ListItem>Tokens</ListItem>
      <ListItem>Themes</ListItem>
      <ListItem>Components</ListItem>
    </List>
  ),
}

export const Ordered: Story = {
  render: () => (
    <List as="ol">
      <ListItem>npx cascivo init</ListItem>
      <ListItem>npx cascivo add button</ListItem>
      <ListItem>Import and render</ListItem>
    </List>
  ),
}

export const Unmarked: Story = {
  render: () => (
    <List marker="none">
      <ListItem>No marker</ListItem>
      <ListItem>Still a list for assistive tech</ListItem>
    </List>
  ),
}

export const Accessibility: Story = {
  render: () => (
    <List>
      <ListItem>One</ListItem>
      <ListItem>Two</ListItem>
    </List>
  ),
  parameters: { a11y: { test: 'error' } },
}
