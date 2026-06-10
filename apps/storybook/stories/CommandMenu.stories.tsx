import { useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { CommandMenu, type CommandGroup } from '@cascade-ui/components/command-menu'

const groups: CommandGroup[] = [
  {
    heading: 'Pages',
    items: [
      { id: 'home', label: 'Go home', keywords: ['start'], onSelect: () => {} },
      { id: 'docs', label: 'Open docs', keywords: ['documentation'], onSelect: () => {} },
      { id: 'blog', label: 'Read the blog', onSelect: () => {} },
    ],
  },
  {
    heading: 'Actions',
    items: [
      { id: 'theme', label: 'Toggle theme', shortcut: ['⌘', 'T'], onSelect: () => {} },
      { id: 'new', label: 'New file', shortcut: ['⌘', 'N'], onSelect: () => {} },
      {
        id: 'settings',
        label: 'Settings',
        page: {
          placeholder: 'Settings…',
          groups: [
            {
              heading: 'Settings',
              items: [
                { id: 'theme-setting', label: 'Change theme', onSelect: () => {} },
                { id: 'lang-setting', label: 'Change language', onSelect: () => {} },
              ],
            },
          ],
        },
      },
    ],
  },
]

function Demo({ loading = false, hotkey = false }) {
  const [open, setOpen] = useState(true)
  return (
    <div style={{ height: '400px' }}>
      <button type="button" onClick={() => setOpen(true)}>
        Open
      </button>
      <CommandMenu open={open} onOpenChange={setOpen} groups={groups} loading={loading} hotkey={hotkey} />
    </div>
  )
}

const meta: Meta = { component: CommandMenu }
export default meta
type Story = StoryObj

export const Default: Story = { render: () => <Demo /> }

export const Loading: Story = { render: () => <Demo loading /> }

export const WithHotkey: Story = { render: () => <Demo hotkey /> }

export const Accessibility: Story = {
  render: () => <Demo />,
  parameters: { a11y: { test: 'error' } },
}
