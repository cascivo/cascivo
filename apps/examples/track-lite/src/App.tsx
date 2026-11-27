import { useSignalEffect, useSignals, useSignalState } from '@cascivo/core'
import { Badge, Button, ToastProvider, useToast } from '@cascivo/react'
import { IssueDialog } from './IssueDialog'
import { LiveStatus } from './LiveStatus'
import {
  advanceIssue,
  deleteIssue,
  issues,
  PRIORITIES,
  startTeammate,
  STATUSES,
  USERS,
} from './store'

function IssueList() {
  useSignals()
  const { toast } = useToast()
  const list = issues.value
  return (
    <section id="issues" aria-label="Issues">
      <p className="tl-count">
        <Badge variant="secondary" size="sm">
          {list.length} issues
        </Badge>
      </p>
      {list.length === 0 ? (
        <p className="tl-empty">No issues</p>
      ) : (
        <ul className="tl-list">
          {list.map((i) => {
            const st = STATUSES[i.status] ?? STATUSES[0]
            const pr = PRIORITIES[i.priority] ?? PRIORITIES[0]
            return (
              <li className="tl-row" key={i.id} id={`issue-${i.id}`}>
                <Badge variant={st.variant} size="sm">
                  {st.label}
                </Badge>
                <Badge variant={pr.variant} size="sm">
                  {pr.label}
                </Badge>
                <span className="tl-issue-title">{i.title}</span>
                <span className="tl-assignee">
                  {i.assignee === null ? 'Unassigned' : USERS[i.assignee]}
                </span>
                <Button
                  variant="secondary"
                  size="sm"
                  aria-label={`Advance ${i.title}`}
                  onClick={() => advanceIssue(i.id)}
                >
                  Advance
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  aria-label={`Delete ${i.title}`}
                  onClick={() => {
                    deleteIssue(i.id)
                    toast({ title: 'Issue deleted', variant: 'success' })
                  }}
                >
                  Delete
                </Button>
              </li>
            )
          })}
        </ul>
      )}
    </section>
  )
}

/** `teammateMs` 0 turns the simulated teammate off (tests, deterministic benchmarks). */
export default function App({ teammateMs = 6000 }: { teammateMs?: number }) {
  useSignals()
  const [open, setOpen] = useSignalState(false)
  useSignalEffect(() => (teammateMs > 0 ? startTeammate(teammateMs) : undefined))
  return (
    <ToastProvider>
      <main className="tl-app">
        <header className="tl-header">
          <h1 className="tl-title">Issues</h1>
          <LiveStatus />
          <Button onClick={() => setOpen(true)}>New issue</Button>
        </header>
        <IssueList />
        <IssueDialog open={open.value} onClose={() => setOpen(false)} />
      </main>
    </ToastProvider>
  )
}
