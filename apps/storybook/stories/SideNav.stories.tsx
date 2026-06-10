import type { Meta, StoryObj } from '@storybook/react-vite'
import { SideNav, type SideNavItem } from '@cascade-ui/components/side-nav'

const meta: Meta<typeof SideNav> = {
  component: SideNav,
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

const homeIcon = (
  <svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true">
    <path
      d="M2 7l6-5 6 5v7H2z"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinejoin="round"
    />
  </svg>
)

const chartIcon = (
  <svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true">
    <path
      d="M2 14V8m4 6V2m4 12V6m4 8v-4"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
    />
  </svg>
)

const gearIcon = (
  <svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true">
    <circle cx="8" cy="8" r="2.5" fill="none" stroke="currentColor" strokeWidth="1.5" />
    <path
      d="M8 1v2.5M8 12.5V15M1 8h2.5M12.5 8H15M3 3l1.8 1.8M11.2 11.2L13 13M13 3l-1.8 1.8M4.8 11.2L3 13"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
    />
  </svg>
)

const items: SideNavItem[] = [
  { label: 'Home', href: '#home', icon: homeIcon, active: true },
  { label: 'Reports', href: '#reports', icon: chartIcon },
  {
    label: 'Settings',
    icon: gearIcon,
    items: [
      { label: 'Profile', href: '#profile' },
      { label: 'Billing', href: '#billing' },
      { label: 'Team', href: '#team' },
    ],
  },
]

export const Default: Story = {
  args: { items },
}

export const Collapsed: Story = {
  args: { items, defaultCollapsed: true },
}

export const ActiveInGroup: Story = {
  args: {
    items: [
      { label: 'Home', href: '#home', icon: homeIcon },
      {
        label: 'Settings',
        icon: gearIcon,
        items: [
          { label: 'Profile', href: '#profile', active: true },
          { label: 'Billing', href: '#billing' },
        ],
      },
    ],
  },
}

export const WithoutIcons: Story = {
  args: {
    items: [
      { label: 'Overview', href: '#overview', active: true },
      { label: 'Activity', href: '#activity' },
      { label: 'Members', href: '#members' },
    ],
  },
}

export const Accessibility: Story = {
  args: { items },
  parameters: {
    a11y: { test: 'error' },
  },
}
