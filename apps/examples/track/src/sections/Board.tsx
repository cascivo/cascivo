'use client'
import { useSignals } from '@cascivo/core'
import { t } from '@cascivo/i18n'
import { Badge, Dropdown } from '@cascivo/react'
import { issues, moveIssue, removeIssue } from '../store/issues'
import type { Issue, IssueStatus } from '../store/issues'
import { USERS, LABELS } from '../data/seed'
import { assigneeFilter } from '../App'
import { editingIssueId } from '../commands'
import { msg } from '../i18n'
import styles from './Board.module.css'

const COLUMNS: { status: IssueStatus; label: string }[] = [
  { status: 'backlog', label: 'statusBacklog' },
  { status: 'todo', label: 'statusTodo' },
  { status: 'in-progress', label: 'statusInProgress' },
  { status: 'in-review', label: 'statusInReview' },
  { status: 'done', label: 'statusDone' },
]

const PRIORITY_VARIANT: Record<
  Issue['priority'],
  'destructive' | 'warning' | 'secondary' | 'outline'
> = {
  urgent: 'destructive',
  high: 'warning',
  medium: 'secondary',
  low: 'outline',
}

function priorityLabel(p: Issue['priority']): string {
  switch (p) {
    case 'urgent':
      return t(msg.priorityUrgent)
    case 'high':
      return t(msg.priorityHigh)
    case 'medium':
      return t(msg.priorityMedium)
    case 'low':
      return t(msg.priorityLow)
  }
}

function statusLabel(s: IssueStatus): string {
  switch (s) {
    case 'backlog':
      return t(msg.statusBacklog)
    case 'todo':
      return t(msg.statusTodo)
    case 'in-progress':
      return t(msg.statusInProgress)
    case 'in-review':
      return t(msg.statusInReview)
    case 'done':
      return t(msg.statusDone)
  }
}

interface CardProps {
  issue: Issue
}

function IssueCard({ issue }: CardProps) {
  const assignee = USERS.find((u) => u.id === issue.assigneeId)
  const labels = LABELS.filter((l) => issue.labelIds.includes(l.id))

  const moveItems = COLUMNS.filter((c) => c.status !== issue.status).map((c) => ({
    label: statusLabel(c.status),
    value: `move:${c.status}`,
  }))

  const menuItems = [
    ...moveItems,
    { label: '', value: '__sep__', separator: true as const },
    { label: t(msg.boardEditIssue), value: 'edit' },
    { label: t(msg.boardDeleteIssue), value: 'delete' },
  ]

  function handleSelect(value: string) {
    if (value.startsWith('move:')) {
      moveIssue(issue.id, value.slice(5) as IssueStatus)
    } else if (value === 'edit') {
      editingIssueId.value = issue.id
    } else if (value === 'delete') {
      removeIssue(issue.id)
    }
  }

  return (
    <div className={styles['card']}>
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          gap: 'var(--cascivo-space-2)',
        }}
      >
        <span className={styles['cardTitle']}>{issue.title}</span>
        <Dropdown
          trigger={
            <button type="button" className={styles['menuButton']} aria-label="Issue actions">
              <svg
                aria-hidden="true"
                width="14"
                height="14"
                viewBox="0 0 16 16"
                fill="currentColor"
              >
                <circle cx="8" cy="2" r="1.5" />
                <circle cx="8" cy="8" r="1.5" />
                <circle cx="8" cy="14" r="1.5" />
              </svg>
            </button>
          }
          items={menuItems}
          onSelect={handleSelect}
          placement="bottom-end"
        />
      </div>
      <div className={styles['cardMeta']}>
        <Badge size="sm" variant={PRIORITY_VARIANT[issue.priority]}>
          {priorityLabel(issue.priority)}
        </Badge>
        {labels.length > 0 && (
          <div className={styles['cardLabels']}>
            {labels.map((l) => (
              <span
                key={l.id}
                className={styles['labelDot']}
                style={{ background: l.color }}
                title={l.name}
                aria-label={l.name}
              />
            ))}
          </div>
        )}
        {assignee && (
          <span className={styles['assigneeInitials']} title={assignee.name}>
            {assignee.initials}
          </span>
        )}
      </div>
    </div>
  )
}

export function Board() {
  useSignals()

  const filter = assigneeFilter.value
  const allIssues = issues.value
  const filtered = filter ? allIssues.filter((i) => i.assigneeId === filter) : allIssues

  return (
    <div className={styles['root']} data-testid="board">
      {COLUMNS.map(({ status }) => {
        const col = filtered.filter((i) => i.status === status)
        return (
          <div key={status} className={styles['column']} data-testid={`column-${status}`}>
            <div className={styles['columnHeader']}>
              <span className={styles['columnTitle']}>{statusLabel(status)}</span>
              <span className={styles['columnCount']}>{col.length}</span>
            </div>
            <div className={styles['cards']}>
              {col.length === 0 ? (
                <div className={styles['empty']}>{t(msg.boardNoIssues)}</div>
              ) : (
                col.map((issue) => <IssueCard key={issue.id} issue={issue} />)
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
