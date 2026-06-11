'use client'
import { Button, EmptyState } from '@cascade-ui/react'
import { DashboardLayout } from '../../dashboard-layout/dashboard-layout'

export interface EmptyDashboardProps {
  onCreateItem?: () => void
}

export function EmptyDashboard({ onCreateItem }: EmptyDashboardProps) {
  return (
    <DashboardLayout
      main={
        <EmptyState
          title="No data yet"
          description="Get started by creating your first item."
          action={<Button onClick={onCreateItem}>Create item</Button>}
        />
      }
    />
  )
}
