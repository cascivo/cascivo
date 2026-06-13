import { useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { Button } from '@cascivo/components/button'
import { Popover, PopoverContent, PopoverTrigger } from '@cascivo/components/popover'

const meta: Meta = {
  title: 'Overlay/Popover',
}
export default meta
type Story = StoryObj

export const Default: Story = {
  render: () => (
    <Popover>
      <PopoverTrigger>
        <Button variant="secondary">Open popover</Button>
      </PopoverTrigger>
      <PopoverContent>
        <p style={{ margin: 0 }}>This is a popover using CSS Anchor Positioning.</p>
      </PopoverContent>
    </Popover>
  ),
}

function ControlledPopover() {
  const [open, setOpen] = useState(false)
  return (
    <div>
      <Button onClick={() => setOpen(!open)}>Toggle (controlled)</Button>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger>
          <Button variant="ghost">Trigger</Button>
        </PopoverTrigger>
        <PopoverContent>
          <p style={{ margin: 0 }}>Controlled popover content.</p>
        </PopoverContent>
      </Popover>
    </div>
  )
}

export const Controlled: Story = { render: () => <ControlledPopover /> }

export const Accessibility: Story = {
  render: () => (
    <Popover>
      <PopoverTrigger>
        <Button variant="secondary">Open popover</Button>
      </PopoverTrigger>
      <PopoverContent>
        <p style={{ margin: 0 }}>Accessible popover content.</p>
      </PopoverContent>
    </Popover>
  ),
  parameters: { a11y: { test: 'error' } },
}
