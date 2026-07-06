// AUTO-GENERATED — do not edit; run `pnpm stories:generate`.
import type { Meta, StoryObj } from '@storybook/react-vite'
import { NavigationMenu } from '@cascivo/react'

const meta: Meta = {
  title: "Navigation/NavigationMenu",
}
export default meta
type Story = StoryObj

export const Basic: Story = {
  name: "Basic",
  render: () => (
    <NavigationMenu aria-label="Main" items={[{ id: "home", label: "Home", href: "/" }, { id: "products", label: "Products", content: <ul>…</ul> }]} />
  ),
}

