import { seededRandom } from '@cascivo/example-kit'

const rng = seededRandom(17)

// --- Users ---

export interface User {
  id: string
  name: string
  initials: string
}

const USER_NAMES = ['Alice Kim', 'Bob Chen', 'Carol Diaz', 'David Osei', 'Eva Novak']

export const USERS: User[] = USER_NAMES.map((name, i) => {
  const parts = name.split(' ')
  return {
    id: `user-${i}`,
    name,
    initials: (parts[0]?.[0] ?? '') + (parts[1]?.[0] ?? ''),
  }
})

// --- Labels ---

export interface Label {
  id: string
  name: string
  color: string
}

export const LABELS: Label[] = [
  { id: 'lbl-0', name: 'bug', color: 'var(--cascivo-color-destructive)' },
  { id: 'lbl-1', name: 'feature', color: 'var(--cascivo-color-accent)' },
  { id: 'lbl-2', name: 'docs', color: 'var(--cascivo-color-warning)' },
  { id: 'lbl-3', name: 'perf', color: 'var(--cascivo-color-success)' },
  { id: 'lbl-4', name: 'security', color: 'var(--cascivo-color-destructive-muted)' },
]

// --- Issues ---

export type IssueStatus = 'backlog' | 'todo' | 'in-progress' | 'in-review' | 'done'
export type IssuePriority = 'urgent' | 'high' | 'medium' | 'low'

export interface Issue {
  id: string
  title: string
  status: IssueStatus
  priority: IssuePriority
  assigneeId: string | null
  labelIds: string[]
  createdAt: string
}

const STATUSES: IssueStatus[] = ['backlog', 'todo', 'in-progress', 'in-review', 'done']
const PRIORITIES: IssuePriority[] = ['urgent', 'high', 'medium', 'low']

const TITLES = [
  'Fix login redirect on mobile',
  'Add dark mode to dashboard',
  'Refactor auth token handling',
  'Write API docs for v2 endpoints',
  'Optimize bundle size',
  'Add rate limiting to search',
  'Fix overflow in card component',
  'Migrate tests to Vitest',
  'Improve error messages in CLI',
  'Add keyboard shortcuts docs',
  'Fix focus trap in modal',
  'Improve table performance',
  'Add CSV export to data table',
  'Fix tooltip z-index issue',
  'Add storybook stories for Badge',
  'Implement drag-and-drop board',
  'Fix RTL layout in form',
  'Update dependencies',
  'Add WCAG audit to CI',
  'Fix broken link in footer',
]

const BASE_DATE = new Date(Date.UTC(2026, 5, 14))

export const SEED_ISSUES: Issue[] = TITLES.map((title, i) => {
  const daysAgo = rng.int(0, 30)
  const d = new Date(BASE_DATE)
  d.setUTCDate(BASE_DATE.getUTCDate() - daysAgo)

  const labelCount = rng.int(0, 2)
  const labelIds: string[] = []
  for (let j = 0; j < labelCount; j++) {
    const lbl = rng.pick(LABELS)
    if (!labelIds.includes(lbl.id)) labelIds.push(lbl.id)
  }

  return {
    id: `issue-${i}`,
    title,
    status: rng.pick(STATUSES),
    priority: rng.pick(PRIORITIES),
    assigneeId: rng.bool(0.7) ? (rng.pick(USERS).id ?? null) : null,
    labelIds,
    createdAt: d.toISOString(),
  }
})
