import { useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { CommandMenu, type CommandGroup, type CommandScope } from '@cascivo/components/command-menu'

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
      <CommandMenu
        open={open}
        onOpenChange={setOpen}
        groups={groups}
        loading={loading}
        hotkey={hotkey}
      />
    </div>
  )
}

const scopes: CommandScope[] = [
  { id: 'clusters', label: 'Clusters', prefix: 'c' },
  { id: 'orgs', label: 'Orgs', prefix: 'o' },
  { id: 'commands', label: 'Commands', prefix: '>' },
]

const richGroups: CommandGroup[] = [
  {
    heading: 'Clusters',
    scope: 'clusters',
    items: [
      {
        id: 'prod-eu',
        label: 'prod-eu-central-1',
        description: 'eu-central-1 · Enterprise · c9f21a04',
        status: { label: 'Healthy', tone: 'healthy' },
        actions: [
          { id: 'open', label: 'Open', shortcut: ['↵'], onSelect: () => {} },
          { id: 'tab', label: 'New tab', shortcut: ['⌘', '↵'], onSelect: () => {} },
        ],
      },
      {
        id: 'prod-us',
        label: 'prod-us-east-2',
        description: 'us-east-2 · Enterprise · a1b2c3d4',
        status: { label: 'Healthy', tone: 'healthy' },
        actions: [{ id: 'open', label: 'Open', shortcut: ['↵'], onSelect: () => {} }],
      },
      {
        id: 'prod-ap',
        label: 'prod-ap-southeast-1',
        description: 'ap-southeast-1 · Team · e5f6a7b8',
        status: { label: 'Degraded', tone: 'degraded' },
        actions: [{ id: 'open', label: 'Open', shortcut: ['↵'], onSelect: () => {} }],
      },
    ],
  },
  {
    heading: 'Orgs',
    scope: 'orgs',
    items: [
      {
        id: 'acme',
        label: 'acme-industries',
        description: 'Enterprise · 12 clusters',
        onSelect: () => {},
      },
      {
        id: 'globex',
        label: 'globex-corp',
        description: 'Enterprise · 8 clusters',
        onSelect: () => {},
      },
    ],
  },
  {
    heading: 'Actions',
    items: [
      { id: 'create', label: 'Create cluster…', shortcut: ['C'], onSelect: () => {} },
      { id: 'restart', label: 'Restart all clusters', onSelect: () => {} },
    ],
  },
]

function RichDemo() {
  const [open, setOpen] = useState(true)
  return (
    <div style={{ height: '520px' }}>
      <button type="button" onClick={() => setOpen(true)}>
        Open
      </button>
      <CommandMenu
        open={open}
        onOpenChange={setOpen}
        groups={richGroups}
        scopes={scopes}
        hotkey={false}
        placeholder="Search… (try c:name, o:name, > for commands)"
      />
    </div>
  )
}

const meta: Meta = {
  title: 'Overlay/CommandMenu',
  component: CommandMenu,
  parameters: { layout: 'fullscreen' },
}
export default meta
type Story = StoryObj

export const Primary: Story = {}

export const Default: Story = { render: () => <Demo /> }

export const Loading: Story = { render: () => <Demo loading /> }

export const WithHotkey: Story = { render: () => <Demo hotkey /> }

export const Scoped: Story = { render: () => <RichDemo /> }

export const Accessibility: Story = {
  render: () => <Demo />,
  parameters: { a11y: { test: 'error' } },
}
