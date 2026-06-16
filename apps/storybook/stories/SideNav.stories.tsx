import type { Meta, StoryObj } from '@storybook/react-vite'
import { SideNav, type SideNavItem } from '@cascivo/components/side-nav'
import { Home, BarChart, Settings, Users, Database, Server, Shield, Activity } from '@cascivo/icons'

const meta: Meta<typeof SideNav> = {
  title: 'Shell/SideNav',
  component: SideNav,
  parameters: { layout: 'fullscreen' },
  decorators: [
    (Story) => (
      <div style={{ display: 'flex', blockSize: 400 }}>
        <Story />
      </div>
    ),
  ],
}
export default meta
type Story = StoryObj<typeof SideNav>

export const Primary: Story = {}

const consoleItems: SideNavItem[] = [
  { label: 'Home', href: '#home', icon: <Home size={16} />, active: true },
  { label: 'Activity', href: '#activity', icon: <Activity size={16} /> },
  {
    label: 'Resources',
    icon: <Server size={16} />,
    items: [
      { label: 'Databases', href: '#db' },
      { label: 'Servers', href: '#srv' },
    ],
  },
  { label: 'Analytics', href: '#analytics', icon: <BarChart size={16} /> },
  { label: 'Users', href: '#users', icon: <Users size={16} /> },
  {
    label: 'Settings',
    icon: <Settings size={16} />,
    items: [
      { label: 'Profile', href: '#profile' },
      { label: 'Security', href: '#security' },
      { label: 'Billing', href: '#billing' },
    ],
  },
]

export const Default: Story = {
  args: { items: consoleItems },
}

export const Collapsed: Story = {
  args: { items: consoleItems, defaultCollapsed: true },
}

export const IconRail: Story = {
  name: 'Icon Rail (collapsed)',
  args: {
    items: consoleItems,
    collapsed: true,
    ariaLabel: 'Console navigation',
  },
}

export const RailWithFallbacks: Story = {
  name: 'Rail with grapheme fallbacks',
  args: {
    items: [
      { label: 'Overview', href: '#overview', active: true },
      { label: 'Analytics', href: '#analytics', icon: <BarChart size={16} /> },
      { label: 'Database', href: '#db', icon: <Database size={16} /> },
      { label: 'Members', href: '#members' },
      { label: 'Permissions', href: '#permissions' },
    ],
    collapsed: true,
  },
}

export const RailFlyout: Story = {
  name: 'Rail flyout (groups)',
  args: {
    items: [
      { label: 'Home', href: '#', icon: <Home size={16} />, active: true },
      {
        label: 'Resources',
        icon: <Server size={16} />,
        items: [
          { label: 'Databases', href: '#db' },
          { label: 'Servers', href: '#srv' },
          { label: 'Storage', href: '#storage' },
        ],
      },
      {
        label: 'Security',
        icon: <Shield size={16} />,
        items: [
          { label: 'Firewall', href: '#fw' },
          { label: 'Certificates', href: '#certs' },
        ],
      },
    ],
    collapsed: true,
  },
}

export const ExpandOnHover: Story = {
  name: 'Expand on hover',
  args: {
    items: consoleItems,
    collapsed: true,
    expandOnHover: true,
  },
}

export const WithFooter: Story = {
  args: {
    items: consoleItems,
    footer: <span style={{ fontSize: 11, padding: '4px 8px' }}>v2.1.0</span>,
  },
}

export const ActiveInGroup: Story = {
  args: {
    items: [
      { label: 'Home', href: '#home', icon: <Home size={16} /> },
      {
        label: 'Settings',
        icon: <Settings size={16} />,
        items: [
          { label: 'Profile', href: '#profile', active: true },
          { label: 'Security', href: '#security' },
        ],
      },
    ],
  },
}

export const Accessibility: Story = {
  args: { items: consoleItems },
  parameters: {
    a11y: { test: 'error' },
  },
}
