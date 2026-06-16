import { useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { Button } from '@cascivo/components/button'
import { AlertDialog } from '@cascivo/components/alert-dialog'

const meta: Meta = {
  title: 'Overlay/AlertDialog',
}
export default meta
type Story = StoryObj

export const Primary: Story = {}

function AlertDialogDemo({ variant }: { variant?: 'destructive' | 'default' }) {
  const [open, setOpen] = useState(false)
  return (
    <>
      <Button
        variant={variant === 'destructive' ? 'destructive' : 'secondary'}
        onClick={() => setOpen(true)}
      >
        {variant === 'destructive' ? 'Delete item' : 'Open dialog'}
      </Button>
      <AlertDialog
        open={open}
        title={variant === 'destructive' ? 'Delete item' : 'Confirm action'}
        description={
          variant === 'destructive'
            ? 'This cannot be undone. The item will be permanently deleted.'
            : 'Are you sure you want to proceed?'
        }
        onConfirm={() => setOpen(false)}
        onCancel={() => setOpen(false)}
        {...(variant ? { variant } : {})}
      />
    </>
  )
}

export const Default: Story = { render: () => <AlertDialogDemo /> }
export const Destructive: Story = { render: () => <AlertDialogDemo variant="destructive" /> }

export const Accessibility: Story = {
  render: () => <AlertDialogDemo />,
  parameters: { a11y: { test: 'error' } },
}
