import { Button, Modal, TextInput } from '@carbon/react'
import { useState } from 'react'

export function DialogPage() {
  const [open, setOpen] = useState(false)

  return (
    <main>
      <Button data-bench="open-dialog" onClick={() => setOpen(true)}>
        Open dialog
      </Button>
      {open && (
        <Modal
          open={open}
          modalHeading="Bench dialog"
          primaryButtonText="Close"
          onRequestClose={() => setOpen(false)}
          onRequestSubmit={() => setOpen(false)}
        >
          <TextInput id="name" labelText="Name" />
          <Button data-bench="close-dialog" onClick={() => setOpen(false)}>
            Close
          </Button>
        </Modal>
      )}
    </main>
  )
}
