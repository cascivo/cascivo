import { Badge, useSignals } from '@cascivo/react'
import { sharedCount } from './shared-count'

export function SharedDisplay() {
  useSignals()
  return <Badge data-testid="shared-display">Shared {sharedCount.value}</Badge>
}
