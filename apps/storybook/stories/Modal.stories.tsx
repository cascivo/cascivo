import { useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { Button } from '@cascade-ui/components/button'
import { Modal } from '@cascade-ui/components/modal'

const meta: Meta<typeof Modal> = {
  component: Modal,
}
export default meta
type Story = StoryObj<typeof Modal>

function ModalDemo({ size }: { size?: 'sm' | 'md' | 'lg' }) {
  const [open, setOpen] = useState(false)
  return (
    <>
      <Button onClick={() => setOpen(true)}>Open modal</Button>
      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Confirm action"
        description="This action cannot be undone. All associated data will be permanently removed."
        {...(size ? { size } : {})}
      >
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
          <Button variant="ghost" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={() => setOpen(false)}>
            Delete
          </Button>
        </div>
      </Modal>
    </>
  )
}

export const Default: Story = { render: () => <ModalDemo /> }
export const Small: Story = { render: () => <ModalDemo size="sm" /> }
export const Large: Story = { render: () => <ModalDemo size="lg" /> }

export const Accessibility: Story = {
  render: () => <ModalDemo />,
  parameters: { a11y: { test: 'error' } },
}
