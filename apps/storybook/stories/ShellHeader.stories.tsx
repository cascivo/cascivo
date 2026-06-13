import type { Meta, StoryObj } from '@storybook/react-vite'
import { ShellHeader } from '@cascivo/components/shell-header'

const meta: Meta<typeof ShellHeader> = {
  title: 'Shell/ShellHeader',
  component: ShellHeader,
  parameters: { layout: 'fullscreen' },
}
export default meta
type Story = StoryObj<typeof ShellHeader>

const nav = [
  { label: 'Overview', href: '#', active: true },
  {
    label: 'Resources',
    items: [
      { label: 'Instances', href: '#' },
      { label: 'Volumes', href: '#' },
      { label: 'Networks', href: '#' },
    ],
  },
  {
    label: 'Manage',
    items: [
      { label: 'Users', href: '#' },
      { label: 'Access groups', href: '#' },
    ],
  },
]

const bellIcon = (
  <svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true">
    <path
      d="M8 2a5 5 0 0 0-5 5v3H2v1h12v-1h-1V7a5 5 0 0 0-5-5zm0 12a2 2 0 0 0 2-2H6a2 2 0 0 0 2 2z"
      fill="currentColor"
    />
  </svg>
)

const gridIcon = (
  <svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true">
    <rect x="2" y="2" width="5" height="5" rx="1" fill="currentColor" />
    <rect x="9" y="2" width="5" height="5" rx="1" fill="currentColor" />
    <rect x="2" y="9" width="5" height="5" rx="1" fill="currentColor" />
    <rect x="9" y="9" width="5" height="5" rx="1" fill="currentColor" />
  </svg>
)

const helpIcon = (
  <svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true">
    <circle cx="8" cy="8" r="6" fill="none" stroke="currentColor" strokeWidth="1.5" />
    <path
      d="M6.5 6a1.5 1.5 0 0 1 3 .5c0 .8-.8 1.2-1.5 2M8 11.5v.5"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
    />
  </svg>
)

export const Default: Story = {
  args: {
    brand: { prefix: 'cascivo', name: 'Console', href: '#' },
    nav,
    actions: [
      { id: 'notifications', label: 'Notifications', icon: bellIcon },
      { id: 'help', label: 'Help', icon: helpIcon },
    ],
  },
}

export const WithDropdowns: Story = {
  args: {
    brand: { prefix: 'cascivo', name: 'Console', href: '#' },
    nav,
  },
}

export const WithHamburger: Story = {
  args: {
    brand: { name: 'Console' },
    onMenuClick: () => {},
    menuExpanded: false,
  },
}

export const GlobalActions: Story = {
  args: {
    brand: { name: 'Console' },
    actions: [
      { id: 'notifications', label: 'Notifications', icon: bellIcon, active: true },
      { id: 'switcher', label: 'Switch application', icon: gridIcon },
      { id: 'help', label: 'Help', icon: helpIcon },
    ],
  },
}

export const BrandOnly: Story = {
  args: {
    brand: { prefix: 'IBM', name: 'Cloud', href: '#' },
  },
}

export const Accessibility: Story = {
  args: {
    brand: { prefix: 'cascivo', name: 'Console', href: '#' },
    nav,
    actions: [{ id: 'notifications', label: 'Notifications', icon: bellIcon }],
  },
}
