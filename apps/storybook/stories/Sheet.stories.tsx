import { useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { Button } from '@cascivo/components/button'
import { Sheet } from '@cascivo/components/sheet'

const meta: Meta = {
  title: 'Overlay/Sheet',
}
export default meta
type Story = StoryObj

export const Primary: Story = {}

function SheetDemo({ side }: { side?: 'start' | 'end' | 'top' | 'bottom' }) {
  const [open, setOpen] = useState(false)
  return (
    <>
      <Button variant="secondary" onClick={() => setOpen(true)}>
        Open sheet ({side ?? 'end'})
      </Button>
      <Sheet
        open={open}
        onClose={() => setOpen(false)}
        title="Settings"
        {...(side ? { side } : {})}
      >
        <p>Configure your preferences here.</p>
        <Button variant="secondary" onClick={() => setOpen(false)}>
          Done
        </Button>
      </Sheet>
    </>
  )
}

export const Default: Story = { render: () => <SheetDemo /> }
export const FromStart: Story = { render: () => <SheetDemo side="start" /> }
export const FromBottom: Story = { render: () => <SheetDemo side="bottom" /> }

export const Accessibility: Story = {
  render: () => <SheetDemo />,
  parameters: { a11y: { test: 'error' } },
}
