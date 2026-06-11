'use client'
import { Alert, Button } from '@cascade-ui/react'
import { Stack } from '../../stack/stack'

interface Notification {
  id: string
  title: string
  description?: string
  variant: 'info' | 'success' | 'warning' | 'destructive'
  read: boolean
}

const demoNotifications: Notification[] = [
  {
    id: '1',
    title: 'Deployment complete',
    description: 'v2.4.0 deployed to production.',
    variant: 'success',
    read: false,
  },
  {
    id: '2',
    title: 'High memory usage',
    description: 'Server memory at 87%.',
    variant: 'warning',
    read: false,
  },
  {
    id: '3',
    title: 'New user signup',
    description: 'alice@example.com just joined.',
    variant: 'info',
    read: true,
  },
]

export interface NotificationCenterProps {
  notifications?: Notification[]
  onMarkAllRead?: () => void
}

export function NotificationCenter({
  notifications = demoNotifications,
  onMarkAllRead,
}: NotificationCenterProps) {
  return (
    <Stack gap={4}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 style={{ margin: 0 }}>Notifications</h2>
        <Button variant="ghost" onClick={onMarkAllRead}>
          Mark all read
        </Button>
      </div>
      <Stack gap={2}>
        {notifications.map((n) => (
          <Alert key={n.id} variant={n.variant} title={n.title}>
            {n.description}
          </Alert>
        ))}
      </Stack>
    </Stack>
  )
}
