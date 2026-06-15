'use client'
import { useSignals } from '@cascivo/core'
import { Avatar, Tooltip } from '@cascivo/react'
import type { Issue } from '../store/issues'
import { USERS } from '../data/seed'
import { editingIssueId } from '../commands'
import styles from './IssueRow.module.css'

interface Props {
  issue: Issue
  index: number
}

function relativeDate(iso: string): string {
  const ms = new Date(2026, 5, 15).getTime() - new Date(iso).getTime()
  const days = Math.floor(ms / 86_400_000)
  if (days === 0) return 'today'
  if (days === 1) return 'yesterday'
  if (days < 30) return `${days}d ago`
  return `${Math.floor(days / 30)}mo ago`
}

export function IssueRow({ issue, index }: Props) {
  useSignals()

  const assignee = USERS.find((u) => u.id === issue.assigneeId)

  return (
    <button
      type="button"
      className={styles['row']}
      onClick={() => {
        editingIssueId.value = issue.id
      }}
    >
      <span className={styles['statusCircle']} data-status={issue.status} aria-hidden />
      <span className={styles['issueId']}>TRK-{index}</span>
      <span className={styles['title']}>{issue.title}</span>
      <span className={styles['spacer']} />
      {assignee ? (
        <Tooltip content={assignee.name}>
          <Avatar name={assignee.name} size="sm" />
        </Tooltip>
      ) : (
        <span className={styles['avatarPlaceholder']} />
      )}
      <span className={styles['date']}>{relativeDate(issue.createdAt)}</span>
    </button>
  )
}
