import type { Meta, StoryObj } from '@storybook/react-vite'
import { Button } from '@cascade-ui/components/button'
import { Tooltip } from '@cascade-ui/components/tooltip'

const meta: Meta<typeof Tooltip> = {
  component: Tooltip,
  args: { content: 'Copied to clipboard' },
}
export default meta
type Story = StoryObj<typeof Tooltip>

export const Default: Story = {
  render: (args) => (
    <div style={{ padding: '4rem', display: 'grid', placeItems: 'center' }}>
      <Tooltip {...args}>
        <Button variant="secondary">Hover me</Button>
      </Tooltip>
    </div>
  ),
}

export const AllPlacements: Story = {
  render: () => (
    <div style={{ padding: '5rem', display: 'flex', gap: 16, justifyContent: 'center' }}>
      {(['top', 'right', 'bottom', 'left'] as const).map((placement) => (
        <Tooltip key={placement} content={`Placement: ${placement}`} placement={placement}>
          <Button variant="ghost">{placement}</Button>
        </Tooltip>
      ))}
    </div>
  ),
}

export const WithDelay: Story = {
  render: () => (
    <div style={{ padding: '4rem', display: 'grid', placeItems: 'center' }}>
      <Tooltip content="Appears after 500ms" delay={500}>
        <Button variant="secondary">Slow tooltip</Button>
      </Tooltip>
    </div>
  ),
}

export const Accessibility: Story = {
  render: () => (
    <div style={{ padding: '4rem', display: 'grid', placeItems: 'center' }}>
      <Tooltip content="Keyboard-focusable trigger">
        <Button>Focus me with Tab</Button>
      </Tooltip>
    </div>
  ),
  parameters: { a11y: { test: 'error' } },
}
