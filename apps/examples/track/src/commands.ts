import { signal } from '@cascivo/core'

// Signals driven by keyboard shortcuts
export const newIssueOpen = signal(false)
export const editingIssueId = signal<string | null>(null)
