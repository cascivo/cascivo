// AUTO-GENERATED — do not edit; run `pnpm stories:generate`.
import type { Meta, StoryObj } from '@storybook/react-vite'
import { Logo } from '@cascivo/react'

const meta: Meta = {
  title: 'Display/Logo',
}
export default meta
type Story = StoryObj

export const Mark: Story = {
  name: 'Mark',
  render: () => <Logo />,
}

export const TwoColour: Story = {
  name: 'Two colour',
  render: () => <Logo variant="mark-accent" />,
}

export const HorizontalLockup: Story = {
  name: 'Horizontal lockup',
  render: () => <Logo variant="horizontal" />,
}

export const NavLockup: Story = {
  name: 'Nav lockup',
  render: () => <Logo variant="nav" />,
}

export const Stacked: Story = {
  name: 'Stacked',
  render: () => <Logo variant="stacked" size={48} />,
}
