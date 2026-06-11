'use client'
import { useSignal } from '@cascade-ui/core'
import { Button } from '@cascade-ui/components/button'

export function CopyCommand({ command }: { command: string }) {
  const copied = useSignal(false)

  return (
    <div className="copy-command">
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
