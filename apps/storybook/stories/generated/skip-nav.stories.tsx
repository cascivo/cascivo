// AUTO-GENERATED — do not edit; run `pnpm stories:generate`.
import type { Meta, StoryObj } from '@storybook/react-vite'
import { SkipNavLink, SkipNavTarget } from '@cascivo/react'

const meta: Meta = {
  title: 'Navigation/SkipNav',
}
export default meta
type Story = StoryObj

export const DefaultPair: Story = {
  name: 'Default pair',
  render: () => (
    <>
      <SkipNavLink />
      <nav>…</nav>
      <SkipNavTarget />
      <main>…</main>
    </>
  ),
}

export const CustomTarget: Story = {
  name: 'Custom target',
  render: () => (
    <>
      <SkipNavLink targetId="main-content" />
      <SkipNavTarget id="main-content" />
    </>
  ),
}
