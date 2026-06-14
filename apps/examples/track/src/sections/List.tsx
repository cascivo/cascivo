'use client'
import { useSignals } from '@cascivo/core'
import { t } from '@cascivo/i18n'
import { Badge, DataTable, ContextMenu, ContextMenuItem, EmptyState } from '@cascivo/react'
import type { Column } from '@cascivo/react'
import { issues, removeIssue } from '../store/issues'
import type { Issue } from '../store/issues'
import { USERS, LABELS } from '../data/seed'
import { assigneeFilter } from '../App'
import { editingIssueId } from '../commands'
import { msg } from '../i18n'
import styles from './List.module.css'

const PRIORITY_VARIANT: Record<
  Issue['priority'],
  'destructive' | 'warning' | 'secondary' | 'outline'
> = {
  urgent: 'destructive',
  high: 'warning',
  medium: 'secondary',
  low: 'outline',
}

const STATUS_VARIANT: Record<
  Issue['status'],
  'default' | 'secondary' | 'success' | 'warning' | 'outline'
> = {
  backlog: 'outline',
  todo: 'secondary',
  'in-progress': 'warning',
  'in-review': 'default',
  done: 'success',
}

function statusLabel(s: Issue['status']): string {
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

export function List() {
  useSignals()

  const filter = assigneeFilter.value
  const allIssues = issues.value
  const rows = filter ? allIssues.filter((i) => i.assigneeId === filter) : allIssues

  const columns: Column<Issue>[] = [
    {
      key: 'title',
      header: t(msg.listColTitle),
      render: (row) => (
        <ContextMenu>
          <span style={{ cursor: 'context-menu' }}>{row.title}</span>
          <ContextMenuItem
            onSelect={() => {
              editingIssueId.value = row.id
            }}
          >
            {t(msg.listEditIssue)}
          </ContextMenuItem>
          <ContextMenuItem
            onSelect={() => {
              removeIssue(row.id)
            }}
          >
            {t(msg.listDeleteIssue)}
          </ContextMenuItem>
        </ContextMenu>
      ),
    },
    {
      key: 'status',
      header: t(msg.listColStatus),
      render: (row) => (
        <Badge size="sm" variant={STATUS_VARIANT[row.status]}>
          {statusLabel(row.status)}
        </Badge>
      ),
    },
    {
      key: 'priority',
      header: t(msg.listColPriority),
      render: (row) => (
        <Badge size="sm" variant={PRIORITY_VARIANT[row.priority]}>
          {priorityLabel(row.priority)}
        </Badge>
      ),
    },
    {
      key: 'assigneeId',
      header: t(msg.listColAssignee),
      render: (row) => {
        if (!row.assigneeId)
          return (
            <span style={{ color: 'var(--cascivo-color-foreground-muted)' }}>
              {t(msg.unassigned)}
            </span>
          )
        const user = USERS.find((u) => u.id === row.assigneeId)
        return <span>{user?.name ?? t(msg.unassigned)}</span>
      },
    },
    {
      key: 'labelIds',
      header: t(msg.listColLabels),
      render: (row) => {
        const lbls = LABELS.filter((l) => row.labelIds.includes(l.id))
        if (lbls.length === 0)
          return <span style={{ color: 'var(--cascivo-color-foreground-muted)' }}>—</span>
        return (
          <div className={styles['labelsCell']}>
            {lbls.map((l) => (
              <span
                key={l.id}
                className={styles['labelDot']}
                style={{ background: l.color }}
                title={l.name}
              />
            ))}
            {lbls.map((l) => (
              <span key={`name-${l.id}`} style={{ fontSize: 'var(--cascivo-text-xs)' }}>
                {l.name}
              </span>
            ))}
          </div>
        )
      },
    },
  ]

  return (
    <div className={styles['root']} data-testid="list">
      <DataTable
        columns={columns}
        rows={rows}
        getRowId={(row) => row.id}
        searchable
        pagination={{ pageSize: 10 }}
        emptyState={<EmptyState title={t(msg.listEmpty)} />}
        stickyHeader
      />
    </div>
  )
}
