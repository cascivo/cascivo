import type { Meta, StoryObj } from '@storybook/react-vite'
import { Button } from '@cascade-ui/components/button'
import { ToastProvider, useToast, type ToastOptions } from '@cascade-ui/components/toast'

function ToastTrigger(options: ToastOptions) {
  const { toast } = useToast()
  return (
    <Button variant="secondary" onClick={() => toast(options)}>
      Show {options.variant ?? 'default'} toast
    </Button>
  )
}

const meta: Meta<typeof ToastProvider> = {
  component: ToastProvider,
}
export default meta
type Story = StoryObj<typeof ToastProvider>

export const Default: Story = {
  render: () => (
    <ToastProvider>
      <ToastTrigger title="Saved" description="Your changes are safe." />
    </ToastProvider>
  ),
}

export const AllVariants: Story = {
  render: () => (
    <ToastProvider>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <ToastTrigger title="Note" description="A neutral message." />
        <ToastTrigger title="Saved" description="All good." variant="success" />
        <ToastTrigger title="Careful" description="Check your input." variant="warning" />
        <ToastTrigger title="Failed" description="Something broke." variant="destructive" />
      </div>
    </ToastProvider>
  ),
}

export const LongDuration: Story = {
  render: () => (
    <ToastProvider>
      <ToastTrigger title="Sticky-ish" description="Stays for 10 seconds." duration={10000} />
    </ToastProvider>
  ),
}

export const Accessibility: Story = {
  render: () => (
    <ToastProvider>
      <ToastTrigger title="Order placed" description="Announced politely." variant="success" />
    </ToastProvider>
  ),
  parameters: { a11y: { test: 'error' } },
}
