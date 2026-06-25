'use client'
import { useSignal, useSignals } from '@cascivo/core'
import { Button } from '@cascivo/components/button'

export function CopyCommand({ command }: { command: string }) {
  useSignals()
  const copied = useSignal(false)

  return (
    <div className="copy-command" tabIndex={0}>
      <code>{command}</code>
      <Button
        size="sm"
        variant="ghost"
        aria-label={copied.value ? 'Copied' : `Copy ${command}`}
        onClick={() => {
          void navigator.clipboard.writeText(command)
          copied.value = true
          setTimeout(() => {
            copied.value = false
          }, 1500)
        }}
      >
        {copied.value ? 'Copied' : 'Copy'}
      </Button>
    </div>
  )
}
