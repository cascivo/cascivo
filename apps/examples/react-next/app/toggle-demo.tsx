'use client' // client boundary — this island ships to the browser and hydrates
import { useSignal, useSignals } from '@cascivo/core'
import { Text, Toggle } from '@cascivo/react'

export function ToggleDemo() {
  // Next.js applies no signals Babel transform, so any component that reads
  // signal.value during render must subscribe explicitly via useSignals().
  useSignals()
  const enabled = useSignal(false)

  return (
    <>
      <Toggle
        label="Notifications"
        checked={enabled.value}
        onChange={(next) => {
          enabled.value = next
        }}
      />
      <Text size="sm" muted>
        Signal value: {enabled.value ? 'on' : 'off'}
      </Text>
    </>
  )
}
