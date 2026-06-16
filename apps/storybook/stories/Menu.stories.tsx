import type { Meta, StoryObj } from '@storybook/react-vite'
import { Button } from '@cascivo/components/button'
import { Menu, MenuItem, MenuSeparator, MenuTrigger } from '@cascivo/components/menu'

const meta: Meta = {
  title: 'Overlay/Menu',
}
export default meta
type Story = StoryObj

export const Primary: Story = {}

export const Default: Story = {
  render: () => (
    <Menu>
      <MenuTrigger>
        <Button variant="secondary">Actions ▾</Button>
      </MenuTrigger>
      <MenuItem onSelect={() => {}}>Edit</MenuItem>
      <MenuItem onSelect={() => {}}>Duplicate</MenuItem>
      <MenuSeparator />
      <MenuItem onSelect={() => {}} disabled>
        Archived (disabled)
      </MenuItem>
      <MenuItem onSelect={() => {}}>Delete</MenuItem>
    </Menu>
  ),
}

export const Accessibility: Story = {
  render: () => (
    <Menu>
      <MenuTrigger>
        <Button variant="secondary">Actions ▾</Button>
      </MenuTrigger>
      <MenuItem onSelect={() => {}}>Edit</MenuItem>
      <MenuItem onSelect={() => {}}>Delete</MenuItem>
    </Menu>
  ),
  parameters: { a11y: { test: 'error' } },
}
