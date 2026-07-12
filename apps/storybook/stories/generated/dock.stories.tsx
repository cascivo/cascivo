// AUTO-GENERATED — do not edit; run `pnpm stories:generate`.
import type { Meta, StoryObj } from '@storybook/react-vite'
import { Dock } from '@cascivo/react'

const meta: Meta = {
  title: "Navigation/Dock",
}
export default meta
type Story = StoryObj

export const WithHrefs: Story = {
  name: "With hrefs",
  render: () => (
    <Dock
      activeIndex={1}
      items={[
        { label: 'Feed', icon: '📰', href: '/feed' },
        { label: 'Explore', icon: '🌐', href: '/explore' },
        { label: 'Notifications', icon: '🔔', href: '/notifications' },
        { label: 'Profile', icon: '👤', href: '/profile' },
      ]}
    />
  ),
}

