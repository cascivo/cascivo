import type { Meta, StoryObj } from '@storybook/react-vite'
import { ContextMenu, ContextMenuItem } from '@cascade-ui/components/context-menu'

const meta: Meta = {
  title: 'Overlay/ContextMenu',
}
export default meta
type Story = StoryObj

export const Default: Story = {
  render: () => (
    <ContextMenu>
      <div
        style={{
          padding: '2rem',
          border: '2px dashed var(--cascade-color-border)',
          borderRadius: 'var(--cascade-radius-md)',
          userSelect: 'none',
          textAlign: 'center',
        }}
      >
        Right-click anywhere here
      </div>
      <ContextMenuItem onSelect={() => {}}>Copy</ContextMenuItem>
      <ContextMenuItem onSelect={() => {}}>Paste</ContextMenuItem>
      <ContextMenuItem onSelect={() => {}} disabled>
        Cut (disabled)
      </ContextMenuItem>
    </ContextMenu>
  ),
}

export const Accessibility: Story = {
  render: () => (
    <ContextMenu>
      <div style={{ padding: '2rem', border: '2px dashed var(--cascade-color-border)' }}>
        Right-click for menu
      </div>
      <ContextMenuItem onSelect={() => {}}>Action</ContextMenuItem>
    </ContextMenu>
  ),
  parameters: { a11y: { test: 'error' } },
}
