import { useSignalEffect, useSignals, useSignalState } from '@cascivo/core'
import { Badge } from '@cascivo/react'
import { changedAt } from './store'

// Twin of the Solid island track-lite-htmx/src/live.tsx: a local clock reset by every change.
export function LiveStatus() {
  useSignals()
  const [seconds, setSeconds] = useSignalState(0)
  useSignalEffect(() => {
    const from = changedAt.value
    setSeconds(0)
    const timer = setInterval(() => setSeconds(Math.floor((Date.now() - from) / 1000)), 1000)
    return () => clearInterval(timer)
  })
  return (
    <Badge variant="success" size="sm">
      Live · updated {seconds.value}s ago
    </Badge>
  )
}
