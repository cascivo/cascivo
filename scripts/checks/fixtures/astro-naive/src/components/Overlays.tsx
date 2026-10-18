import {
  Button,
  Modal,
  Popover,
  PopoverContent,
  PopoverTrigger,
  useSignalState,
  useSignals,
} from '@cascivo/react'

// The links live inside the overlays: a modal makes the rest of the page inert, and a click
// outside an auto popover light-dismisses it before the navigation starts.
export function Overlays() {
  useSignals()
  const [open, setOpen] = useSignalState(false)
  return (
    <>
      <Button data-testid="open-modal" onClick={() => setOpen(true)}>
        Open modal
      </Button>
      <Modal open={open.value} onClose={() => setOpen(false)} title="Persisted modal">
        <a href="/vt-b" data-testid="modal-link">
          Go to B from the modal
        </a>
      </Modal>
      <Popover>
        <PopoverTrigger>Open popover</PopoverTrigger>
        <PopoverContent>
          <a href="/vt-b" data-testid="popover-link">
            Go to B from the popover
          </a>
        </PopoverContent>
      </Popover>
    </>
  )
}
