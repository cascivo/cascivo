import { useSignals, useSignalState } from '@cascivo/core'
import { Button, Input, Modal, Select, useToast } from '@cascivo/react'
import { createIssue, PRIORITIES, STATUSES, USERS } from './store'

const STATUS_OPTIONS = STATUSES.map((s) => ({ value: s.value, label: s.label }))
const PRIORITY_OPTIONS = PRIORITIES.map((p) => ({ value: p.value, label: p.label }))
const USER_OPTIONS = [
  { value: '', label: 'Unassigned' },
  ...USERS.map((u) => ({ value: u, label: u })),
]

// The server's rule (`Rule::text().required().min_len(3).max_len(80)`) and its default messages.
function titleError(title: string): string | undefined {
  const n = title.trim().length
  if (n === 0) return 'This field is required.'
  if (n < 3) return 'Use at least 3 characters.'
  if (n > 80) return 'Use at most 80 characters.'
  return undefined
}

export function IssueDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  useSignals()
  const { toast } = useToast()
  const [title, setTitle] = useSignalState('')
  const [status, setStatus] = useSignalState('backlog')
  const [priority, setPriority] = useSignalState('medium')
  const [assignee, setAssignee] = useSignalState('')
  const [error, setError] = useSignalState<string | undefined>(undefined)

  function close() {
    setTitle('')
    setStatus('backlog')
    setPriority('medium')
    setAssignee('')
    setError(undefined)
    onClose()
  }

  return (
    <Modal open={open} onClose={close} title="New issue" size="md">
      <form
        className="tl-form"
        noValidate
        onSubmit={(e) => {
          e.preventDefault()
          const err = titleError(title.value)
          setError(err)
          if (err) return
          createIssue({
            title: title.value.trim(),
            status: STATUSES.findIndex((s) => s.value === status.value),
            priority: PRIORITIES.findIndex((p) => p.value === priority.value),
            assignee: assignee.value
              ? USERS.indexOf(assignee.value as (typeof USERS)[number])
              : null,
          })
          toast({ title: 'Issue created', variant: 'success' })
          close()
        }}
      >
        <Input
          label="Title"
          placeholder="Issue title"
          value={title.value}
          onChange={(e) => setTitle(e.currentTarget.value)}
          {...(error.value ? { error: error.value } : {})}
        />
        <Select
          label="Status"
          options={STATUS_OPTIONS}
          value={status.value}
          onChange={(e) => setStatus(e.currentTarget.value)}
        />
        <Select
          label="Priority"
          options={PRIORITY_OPTIONS}
          value={priority.value}
          onChange={(e) => setPriority(e.currentTarget.value)}
        />
        <Select
          label="Assignee"
          options={USER_OPTIONS}
          value={assignee.value}
          onChange={(e) => setAssignee(e.currentTarget.value)}
        />
        <div className="cv-modal-footer">
          <Button type="button" variant="secondary" onClick={close}>
            Cancel
          </Button>
          <Button type="submit">Create issue</Button>
        </div>
      </form>
    </Modal>
  )
}
