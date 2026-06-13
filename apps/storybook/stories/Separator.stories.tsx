import type { Meta, StoryObj } from '@storybook/react-vite'
import { Separator } from '@cascivo/components/separator'

const meta: Meta<typeof Separator> = {
  title: 'Display/Separator',
  component: Separator,
}
export default meta
type Story = StoryObj<typeof Separator>

export const Horizontal: Story = {
  render: () => (
    <div style={{ maxWidth: 320 }}>
      <p>Content above</p>
      <Separator />
      <p>Content below</p>
    </div>
  ),
}

export const Vertical: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: 12, alignItems: 'center', blockSize: 32 }}>
      <span>Docs</span>
      <Separator orientation="vertical" />
      <span>API</span>
      <Separator orientation="vertical" />
      <span>Blog</span>
    </div>
  ),
}

export const Decorative: Story = {
  render: () => (
    <div style={{ maxWidth: 320 }}>
      <p>Purely visual divider below (hidden from assistive tech)</p>
      <Separator decorative />
    </div>
  ),
}

export const Accessibility: Story = {
  render: () => (
    <div style={{ maxWidth: 320 }}>
      <p>Section one</p>
      <Separator />
      <p>Section two</p>
    </div>
  ),
  parameters: { a11y: { test: 'error' } },
}
