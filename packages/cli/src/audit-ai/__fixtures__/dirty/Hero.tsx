import { Button, Tooltip } from '@cascivo/react'

export function Hero() {
  return (
    <div style={{ color: 'oklch(0.373 0.015 264)' }}>
      <Button frobnicate>Click</Button>
      <Tooltip>Hover me</Tooltip>
    </div>
  )
}
