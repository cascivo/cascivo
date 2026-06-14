import { persistedSignal } from '@cascivo/storage'
import { SEED_ISSUES } from '../data/seed'
import type { Issue, IssueStatus } from '../data/seed'

export type { Issue, IssueStatus }

// Persisted signal — survives page reload
export const issues = persistedSignal<Issue[]>('track-issues', SEED_ISSUES)

export function createIssue(partial: Omit<Issue, 'id' | 'createdAt'>): Issue {
  const issue: Issue = {
    ...partial,
    id: `issue-${Date.now()}`,
    createdAt: new Date().toISOString(),
  }
  issues.value = [...issues.value, issue]
  return issue
}

export function updateIssue(id: string, patch: Partial<Omit<Issue, 'id' | 'createdAt'>>): void {
  issues.value = issues.value.map((issue) => (issue.id === id ? { ...issue, ...patch } : issue))
}

export function moveIssue(id: string, status: IssueStatus): void {
  updateIssue(id, { status })
}

export function removeIssue(id: string): void {
  issues.value = issues.value.filter((issue) => issue.id !== id)
}
