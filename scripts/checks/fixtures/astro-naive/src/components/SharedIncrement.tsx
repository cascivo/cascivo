import { Button } from '@cascivo/react'
import { sharedCount } from './shared-count'

export function SharedIncrement() {
  return (
    <Button data-testid="shared-increment" onClick={() => (sharedCount.value += 1)}>
      Increment shared
    </Button>
  )
}
