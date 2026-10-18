import { Button, ToastProvider, useToast } from '@cascivo/react'

function NotifyButton() {
  const { toast } = useToast()
  return (
    <Button data-testid="notify" onClick={() => toast({ title: 'Saved from an island' })}>
      Notify
    </Button>
  )
}

export function Notifier() {
  return (
    <ToastProvider>
      <NotifyButton />
    </ToastProvider>
  )
}
