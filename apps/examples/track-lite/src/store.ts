import { signal } from '@cascivo/core'

// The same tables and seed as track-lite-htmx/server/src/lib.rs, so both demos start equal.
export const STATUSES = [
  { value: 'backlog', label: 'Backlog', variant: 'outline' },
  { value: 'todo', label: 'Todo', variant: 'secondary' },
  { value: 'in-progress', label: 'In Progress', variant: 'warning' },
  { value: 'in-review', label: 'In Review', variant: 'info' },
  { value: 'done', label: 'Done', variant: 'success' },
] as const
export const PRIORITIES = [
  { value: 'urgent', label: 'Urgent', variant: 'destructive' },
  { value: 'high', label: 'High', variant: 'warning' },
  { value: 'medium', label: 'Medium', variant: 'secondary' },
  { value: 'low', label: 'Low', variant: 'outline' },
] as const
export const USERS = ['Alice Kim', 'Bob Chen', 'Carol Diaz', 'David Osei', 'Eva Novak'] as const

export interface Issue {
  id: number
  title: string
  status: number
  priority: number
  assignee: number | null
}

const SEED: Issue[] = [
  { id: 1, title: 'Fix login redirect loop', status: 2, priority: 0, assignee: 0 },
  { id: 2, title: 'Add dark mode toggle', status: 1, priority: 2, assignee: 1 },
  { id: 3, title: 'Write onboarding docs', status: 0, priority: 3, assignee: null },
  { id: 4, title: 'Cache search results', status: 3, priority: 1, assignee: 2 },
  { id: 5, title: 'Rate-limit the public API', status: 1, priority: 1, assignee: 3 },
  { id: 6, title: 'Upgrade the build toolchain', status: 4, priority: 2, assignee: 4 },
]

export const issues = signal<Issue[]>(SEED)
// When the list last changed (any source): LiveStatus counts from here.
export const changedAt = signal(Date.now())
let nextId = 7
let tick = 0

function commit(next: Issue[]): void {
  issues.value = next
  changedAt.value = Date.now()
}

export function resetStore(): void {
  nextId = 7
  tick = 0
  commit(SEED)
}

export function createIssue(input: Omit<Issue, 'id'>): void {
  commit([...issues.value, { ...input, id: nextId++ }])
}

export function advanceIssue(id: number): void {
  commit(
    issues.value.map((i) => (i.id === id ? { ...i, status: (i.status + 1) % STATUSES.length } : i)),
  )
}

export function deleteIssue(id: number): void {
  commit(issues.value.filter((i) => i.id !== id))
}

/** The simulated teammate: the same moves the htmx server's `spawn_teammate` makes. */
export function startTeammate(everyMs: number): () => void {
  const timer = setInterval(() => {
    const list = issues.value
    if (list.length === 0) return
    const target = list[tick % list.length]
    tick += 1
    if (target) advanceIssue(target.id)
  }, everyMs)
  return () => clearInterval(timer)
}
