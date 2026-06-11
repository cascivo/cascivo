import { useSignal } from '@cascade-ui/core'
import { Button, Input, Modal } from '@cascade-ui/react'

export function DialogPage() {
  const open = useSignal(false)

  return (
    <main>
      <Button data-bench="open-dialog" onClick={() => (open.value = true)}>
        Open dialog
      </Button>
      <Modal open={open.value} onClose={() => (open.value = false)} title="Bench dialog">
        <Input label="Name" />
        <Button data-bench="close-dialog" onClick={() => (open.value = false)}>
          Close
        </Button>
      </Modal>
    </main>
  )
}
