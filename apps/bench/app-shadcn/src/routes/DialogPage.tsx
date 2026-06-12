import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'

export function DialogPage() {
  const [open, setOpen] = useState(false)

  return (
    <main className="p-4">
      <Button data-bench="open-dialog" onClick={() => setOpen(true)}>
        Open dialog
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogTitle>Bench dialog</DialogTitle>
          <Input placeholder="Name" />
          <Button data-bench="close-dialog" onClick={() => setOpen(false)}>
            Close
          </Button>
        </DialogContent>
      </Dialog>
    </main>
  )
}
