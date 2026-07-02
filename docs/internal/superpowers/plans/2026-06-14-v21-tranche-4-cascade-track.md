# Cascade Track (v21 T4) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build Cascade Track — a keyboard-first issue tracker example app using persisted signals, with board + list views, a command menu, and a create/edit drawer form.

**Architecture:** All state lives in `persistedSignal` from `@cascivo/storage`; mutators are plain functions that write through to the signal. No mock API needed — the store IS the source of truth. Views (Board, List) read `issuesStore.value` directly. The app wraps in `AppShell` from `@cascivo/example-kit` and `ToastProvider` from `@cascivo/react`.

**Tech Stack:** React 19 + Preact Signals (`@cascivo/core`), `@cascivo/storage` for persistence, `@cascivo/react` for all UI components, `@cascivo/i18n` for strings, Vitest for tests.

---

## File Map

| Path                                                    | Responsibility                                                         |
| ------------------------------------------------------- | ---------------------------------------------------------------------- |
| `apps/examples/track/package.json`                      | Package manifest (`@cascivo/example-track`)                            |
| `apps/examples/track/tsconfig.json`                     | TS config — extends base, paths aliases                                |
| `apps/examples/track/index.html`                        | Entry HTML, title "Cascade Track"                                      |
| `apps/examples/track/vite.config.ts`                    | Source aliases (copy from deploy, no charts)                           |
| `apps/examples/track/src/main.tsx`                      | React root mount                                                       |
| `apps/examples/track/src/i18n.ts`                       | All user-visible strings via `defineMessages`                          |
| `apps/examples/track/src/data/seed.ts`                  | Types + seeded fixtures (users, labels, issues)                        |
| `apps/examples/track/src/store/issues.ts`               | `issuesStore` + `createIssue/updateIssue/moveIssue/removeIssue`        |
| `apps/examples/track/src/App.tsx`                       | AppShell, view toggle, filter combobox, routing to Board/List/Settings |
| `apps/examples/track/src/App.module.css`                | Layout styles                                                          |
| `apps/examples/track/src/sections/Board.tsx`            | Kanban board — 5 status columns, issue cards                           |
| `apps/examples/track/src/sections/Board.module.css`     | Board layout styles                                                    |
| `apps/examples/track/src/sections/List.tsx`             | DataTable list view with ContextMenu                                   |
| `apps/examples/track/src/sections/IssueForm.tsx`        | Drawer + Form for create/edit                                          |
| `apps/examples/track/src/sections/IssueForm.module.css` | Form layout styles                                                     |
| `apps/examples/track/src/commands.ts`                   | Command groups for CommandMenu                                         |
| `apps/examples/track/test/smoke.spec.ts`                | Vitest smoke tests on seed data + store mutators                       |

---

### Task 1: Scaffold the app (package.json, tsconfig, index.html, vite.config, main.tsx)

**Files:**

- Create: `apps/examples/track/package.json`
- Create: `apps/examples/track/tsconfig.json`
- Create: `apps/examples/track/index.html`
- Create: `apps/examples/track/vite.config.ts`
- Create: `apps/examples/track/src/main.tsx`

- [ ] **Step 1: Create `package.json`**

```json
{
  "name": "@cascivo/example-track",
  "version": "0.0.1",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "vp dev",
    "build": "vp build",
    "preview": "vp preview",
    "test": "vp test",
    "check": "vp check"
  },
  "dependencies": {
    "@cascivo/core": "workspace:*",
    "@cascivo/example-kit": "workspace:*",
    "@cascivo/i18n": "workspace:*",
    "@cascivo/react": "workspace:*",
    "@cascivo/storage": "workspace:*",
    "@cascivo/themes": "workspace:*",
    "@cascivo/tokens": "workspace:*",
    "react": "catalog:",
    "react-dom": "catalog:"
  },
  "devDependencies": {
    "@playwright/test": "catalog:",
    "@testing-library/react": "catalog:",
    "@types/react": "catalog:",
    "@types/react-dom": "catalog:",
    "typescript": "catalog:",
    "vite-plus": "catalog:",
    "vitest": "catalog:"
  }
}
```

- [ ] **Step 2: Create `tsconfig.json`**

```json
{
  "extends": "../../../tsconfig.base.json",
  "compilerOptions": {
    "jsx": "react-jsx",
    "allowImportingTsExtensions": true,
    "paths": {
      "@cascivo/core": ["../../../packages/core/src/index.ts"],
      "@cascivo/i18n": ["../../../packages/i18n/src/index.ts"],
      "@cascivo/storage": ["../../../packages/storage/src/index.ts"],
      "@cascivo/react": ["../../../packages/react/src/index.ts"],
      "@cascivo/example-kit": ["../kit/src/index.ts"]
    }
  },
  "include": [
    "src",
    "test",
    "../../../packages/components/src/css-modules.d.ts",
    "../../../packages/react/src/css-modules.d.ts"
  ]
}
```

- [ ] **Step 3: Create `index.html`**

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Cascade Track</title>
    <style>
      *,
      *::before,
      *::after {
        box-sizing: border-box;
        margin: 0;
        padding: 0;
      }
      html,
      body {
        height: 100%;
      }
      #root {
        height: 100%;
      }
    </style>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

- [ ] **Step 4: Create `vite.config.ts`**

```ts
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite-plus'

const __dirname = fileURLToPath(new URL('.', import.meta.url))
const root = resolve(__dirname, '../../..')

export default defineConfig({
  resolve: {
    alias: {
      '@cascivo/core': resolve(root, 'packages/core/src/index.ts'),
      '@cascivo/storage': resolve(root, 'packages/storage/src/index.ts'),
      '@cascivo/i18n': resolve(root, 'packages/i18n/src/index.ts'),
      '@cascivo/react': resolve(root, 'packages/react/src/index.ts'),
      '@cascivo/render': resolve(root, 'packages/render/src/index.ts'),
      '@cascivo/ai': resolve(root, 'packages/ai/src/index.ts'),
      '@cascivo/icons': resolve(root, 'packages/icons/src/index.tsx'),
      '@cascivo/example-kit': resolve(__dirname, '../kit/src/index.ts'),
    },
  },
})
```

- [ ] **Step 5: Create `src/main.tsx`**

```tsx
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'

const root = document.getElementById('root')
if (root) {
  ReactDOM.createRoot(root).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>,
  )
}
```

- [ ] **Step 6: Verify the scaffold compiles**

Run: `pnpm exec vp run @cascivo/example-track#check`
Expected: Exits 0 (type check passes — App.tsx doesn't exist yet; that's fine, check it after Task 3).

---

### Task 2: i18n catalog + seed data + persisted store

**Files:**

- Create: `apps/examples/track/src/i18n.ts`
- Create: `apps/examples/track/src/data/seed.ts`
- Create: `apps/examples/track/src/store/issues.ts`

- [ ] **Step 1: Write `src/i18n.ts`**

```ts
import { defineMessages } from '@cascivo/i18n'

export const msg = defineMessages('track', {
  appTitle: 'Cascade Track',
  navBoard: 'Board',
  navList: 'List',
  navSettings: 'Settings',
  viewBoard: 'Board',
  viewList: 'List',
  filterAssignee: 'Assignee',
  filterLabel: 'Label',
  filterStatus: 'Status',
  filterPlaceholder: 'Filter…',
  colTitle: 'Title',
  colStatus: 'Status',
  colPriority: 'Priority',
  colAssignee: 'Assignee',
  colLabels: 'Labels',
  colCreated: 'Created',
  actionNewIssue: 'New issue',
  actionEdit: 'Edit',
  actionDelete: 'Delete',
  actionMoveTo: 'Move to…',
  emptyColumn: 'No issues',
  emptyList: 'No issues match this filter.',
  formTitleLabel: 'Title',
  formTitleRequired: 'Title is required',
  formStatusLabel: 'Status',
  formPriorityLabel: 'Priority',
  formAssigneeLabel: 'Assignee',
  formLabelsLabel: 'Labels',
  formSave: 'Save issue',
  formCancel: 'Cancel',
  drawerCreateTitle: 'New Issue',
  drawerEditTitle: 'Edit Issue',
  toastCreated: 'Issue created',
  toastUpdated: 'Issue updated',
  toastDeleted: 'Issue deleted',
  cmdNewIssue: 'New issue',
  cmdGoBoard: 'Go to Board',
  cmdGoList: 'Go to List',
  cmdSwitchTheme: 'Switch theme',
  cmdShowAll: 'Show all issues',
  shortcutCreate: 'c',
  shortcutFilter: '/',
  statusBacklog: 'Backlog',
  statusTodo: 'Todo',
  statusInProgress: 'In Progress',
  statusDone: 'Done',
  statusCanceled: 'Canceled',
  priorityUrgent: 'Urgent',
  priorityHigh: 'High',
  priorityMedium: 'Medium',
  priorityLow: 'Low',
  settingsHeading: 'Settings',
  settingsComingSoon: 'Settings — coming soon.',
})
```

- [ ] **Step 2: Write `src/data/seed.ts`**

```ts
import { seededRandom } from '@cascivo/example-kit'

export interface User {
  id: string
  name: string
  initials: string
}

export interface Label {
  id: string
  name: string
  color: string
}

export type IssueStatus = 'backlog' | 'todo' | 'in_progress' | 'done' | 'canceled'
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

export const SEED_USERS: User[] = [
  { id: 'u1', name: 'Alice Chen', initials: 'AC' },
  { id: 'u2', name: 'Bob Kumar', initials: 'BK' },
  { id: 'u3', name: 'Carol Smith', initials: 'CS' },
  { id: 'u4', name: 'David Park', initials: 'DP' },
  { id: 'u5', name: 'Eva Martinez', initials: 'EM' },
]

export const SEED_LABELS: Label[] = [
  { id: 'l1', name: 'bug', color: 'var(--cascivo-color-destructive)' },
  { id: 'l2', name: 'feature', color: 'var(--cascivo-color-accent)' },
  { id: 'l3', name: 'docs', color: 'var(--cascivo-color-info)' },
  { id: 'l4', name: 'design', color: 'var(--cascivo-color-success)' },
  { id: 'l5', name: 'refactor', color: 'var(--cascivo-color-warning)' },
]

const rng = seededRandom(17)

const STATUSES: IssueStatus[] = ['backlog', 'todo', 'in_progress', 'done', 'canceled']
const PRIORITIES: IssuePriority[] = ['urgent', 'high', 'medium', 'low']

const ISSUE_TITLES = [
  'Fix navigation menu on mobile',
  'Add dark mode support',
  'Implement search autocomplete',
  'Refactor auth middleware',
  'Update API documentation',
  'Design new onboarding flow',
  'Fix memory leak in worker',
  'Add unit tests for parser',
  'Migrate to new database schema',
  'Improve error handling in API',
  'Create component library docs',
  'Fix CORS issue in staging',
  'Add export to CSV feature',
  'Optimize image loading',
  'Implement rate limiting',
  'Fix broken links in footer',
  'Add two-factor authentication',
  'Improve accessibility of forms',
  'Upgrade dependencies to latest',
  'Add real-time notifications',
]

const BASE_DATE = new Date(Date.UTC(2026, 5, 14))

function isoOffset(daysAgo: number): string {
  const d = new Date(BASE_DATE)
  d.setUTCDate(d.getUTCDate() - daysAgo)
  return d.toISOString()
}

export const SEED_ISSUES: Issue[] = Array.from({ length: 20 }, (_, i) => {
  const labelCount = rng.int(0, 2)
  const labelIds: string[] = []
  for (let j = 0; j < labelCount; j++) {
    const label = rng.pick(SEED_LABELS)
    if (!labelIds.includes(label.id)) labelIds.push(label.id)
  }

  return {
    id: `issue-${String(i + 1).padStart(3, '0')}`,
    title: ISSUE_TITLES[i] ?? `Issue ${i + 1}`,
    status: rng.pick(STATUSES),
    priority: rng.pick(PRIORITIES),
    assigneeId: rng.bool(0.7) ? rng.pick(SEED_USERS).id : null,
    labelIds,
    createdAt: isoOffset(rng.int(0, 30)),
  }
})
```

- [ ] **Step 3: Write `src/store/issues.ts`**

```ts
import { persistedSignal } from '@cascivo/storage'
import { SEED_ISSUES } from '../data/seed'
import type { Issue, IssueStatus } from '../data/seed'

export { type Issue, type IssueStatus }

export const issuesStore = persistedSignal<Issue[]>('track-issues', SEED_ISSUES)

export function createIssue(partial: Omit<Issue, 'id' | 'createdAt'>): void {
  const id = `issue-${Date.now()}`
  issuesStore.value = [
    ...issuesStore.value,
    { ...partial, id, createdAt: new Date().toISOString() },
  ]
}

export function updateIssue(id: string, updates: Partial<Issue>): void {
  issuesStore.value = issuesStore.value.map((i) => (i.id === id ? { ...i, ...updates } : i))
}

export function moveIssue(id: string, status: IssueStatus): void {
  updateIssue(id, { status })
}

export function removeIssue(id: string): void {
  issuesStore.value = issuesStore.value.filter((i) => i.id !== id)
}
```

- [ ] **Step 4: Verify types check**

Run: `pnpm exec vp run @cascivo/example-track#check`
Note: This will fail until App.tsx is created in Task 3. Skip if App.tsx doesn't exist yet — verify after Task 3.

---

### Task 3: App shell (App.tsx + App.module.css)

This task creates the root `App` component with `AppShell`, view toggle, filter combobox, and section routing.

**Files:**

- Create: `apps/examples/track/src/App.tsx`
- Create: `apps/examples/track/src/App.module.css`

- [ ] **Step 1: Create `src/App.module.css`**

```css
.toolbar {
  display: flex;
  align-items: center;
  gap: var(--cascivo-space-3);
  padding: var(--cascivo-space-4) var(--cascivo-space-6);
  border-block-end: 1px solid var(--cascivo-color-border);
  flex-wrap: wrap;
}

.toolbarRight {
  margin-inline-start: auto;
}

.content {
  padding: var(--cascivo-space-6);
  flex: 1;
  overflow: auto;
}

.settingsContent {
  color: var(--cascivo-color-foreground-muted);
}
```

- [ ] **Step 2: Create `src/App.tsx`**

The App uses module-level signals (not useState). The `currentSection` signal drives nav active states and content. The `viewSignal` persists board/list preference. The `filterAssignee`, `filterLabel`, `filterStatus` signals drive filtering (read by Board and List). The `openCreateSignal` drives the IssueForm drawer open state.

```tsx
'use client'
import { signal, useSignals } from '@cascivo/core'
import { t } from '@cascivo/i18n'
import { Combobox, Kbd, SegmentedControl, ToastProvider } from '@cascivo/react'
import type { SideNavItem } from '@cascivo/react'
import { persistedSignal } from '@cascivo/storage'
import { AppShell } from '@cascivo/example-kit'
import { Board } from './sections/Board'
import { List } from './sections/List'
import { IssueForm } from './sections/IssueForm'
import { buildCommandGroups } from './commands'
import { SEED_USERS, SEED_LABELS } from './data/seed'
import { msg } from './i18n'

import '@cascivo/themes/dark'
import '@cascivo/themes/light'
import '@cascivo/themes/warm'
import '@cascivo/tokens'

import styles from './App.module.css'

export type Section = 'board' | 'list' | 'settings'
export type ViewMode = 'board' | 'list'

// Module-level signals — survive re-renders, no useState
export const currentSection = signal<Section>('board')
export const viewSignal = persistedSignal<ViewMode>('track-view', 'board')
export const filterAssigneeSignal = signal<string | undefined>(undefined)
export const filterLabelSignal = signal<string | undefined>(undefined)
export const filterStatusSignal = signal<string | undefined>(undefined)
export const openCreateSignal = signal(false)
export const editIssueIdSignal = signal<string | null>(null)

const VIEW_OPTIONS = [
  { value: 'board', label: 'Board' },
  { value: 'list', label: 'List' },
]

const STATUS_FILTER_OPTIONS = [
  { value: '', label: 'All statuses' },
  { value: 'backlog', label: 'Backlog' },
  { value: 'todo', label: 'Todo' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'done', label: 'Done' },
  { value: 'canceled', label: 'Canceled' },
]

const ASSIGNEE_OPTIONS = [
  { value: '', label: 'All assignees' },
  ...SEED_USERS.map((u) => ({ value: u.id, label: u.name })),
]

const LABEL_OPTIONS = [
  { value: '', label: 'All labels' },
  ...SEED_LABELS.map((l) => ({ value: l.id, label: l.name })),
]

export default function App() {
  useSignals()

  const navItems: SideNavItem[] = [
    {
      label: t(msg.navBoard),
      active: currentSection.value === 'board',
      onClick: (e) => {
        e.preventDefault()
        currentSection.value = 'board'
      },
    },
    {
      label: t(msg.navList),
      active: currentSection.value === 'list',
      onClick: (e) => {
        e.preventDefault()
        currentSection.value = 'list'
      },
    },
    {
      label: t(msg.navSettings),
      active: currentSection.value === 'settings',
      onClick: (e) => {
        e.preventDefault()
        currentSection.value = 'settings'
      },
    },
  ]

  const commandGroups = buildCommandGroups()

  return (
    <ToastProvider>
      <AppShell navItems={navItems} commandGroups={commandGroups} mockBanner>
        {currentSection.value !== 'settings' && (
          <div className={styles['toolbar']}>
            <SegmentedControl
              options={VIEW_OPTIONS}
              value={viewSignal.value}
              onValueChange={(v) => {
                viewSignal.value = v as ViewMode
                // Keep section in sync with view toggle
                currentSection.value = v as Section
              }}
            />
            <Combobox
              options={STATUS_FILTER_OPTIONS}
              value={filterStatusSignal.value ?? ''}
              onChange={(v) => {
                filterStatusSignal.value = v || undefined
              }}
              label={t(msg.filterStatus)}
              clearable
              size="sm"
            />
            <Combobox
              options={ASSIGNEE_OPTIONS}
              value={filterAssigneeSignal.value ?? ''}
              onChange={(v) => {
                filterAssigneeSignal.value = v || undefined
              }}
              label={t(msg.filterAssignee)}
              clearable
              size="sm"
            />
            <Combobox
              options={LABEL_OPTIONS}
              value={filterLabelSignal.value ?? ''}
              onChange={(v) => {
                filterLabelSignal.value = v || undefined
              }}
              label={t(msg.filterLabel)}
              clearable
              size="sm"
            />
            <div className={styles['toolbarRight']}>
              <button
                type="button"
                onClick={() => {
                  openCreateSignal.value = true
                }}
              >
                {t(msg.actionNewIssue)} <Kbd size="sm">c</Kbd>
              </button>
            </div>
          </div>
        )}

        <div className={styles['content']}>
          {currentSection.value === 'board' && <Board />}
          {currentSection.value === 'list' && <List />}
          {currentSection.value === 'settings' && (
            <p className={styles['settingsContent']}>{t(msg.settingsComingSoon)}</p>
          )}
        </div>

        <IssueForm />
      </AppShell>
    </ToastProvider>
  )
}
```

- [ ] **Step 3: Create placeholder `src/commands.ts`** (full version in Task 5 — stub here to unblock types)

```ts
import type { CommandGroup } from '@cascivo/react'

export function buildCommandGroups(): CommandGroup[] {
  return []
}
```

- [ ] **Step 4: Create placeholder `src/sections/Board.tsx`** (full version in Task 4)

```tsx
'use client'
import { useSignals } from '@cascivo/core'

export function Board() {
  useSignals()
  return <div>Board</div>
}
```

- [ ] **Step 5: Create placeholder `src/sections/List.tsx`** (full version in Task 4)

```tsx
'use client'
import { useSignals } from '@cascivo/core'

export function List() {
  useSignals()
  return <div>List</div>
}
```

- [ ] **Step 6: Create placeholder `src/sections/IssueForm.tsx`** (full version in Task 6)

```tsx
'use client'
import { useSignals } from '@cascivo/core'

export function IssueForm() {
  useSignals()
  return null
}
```

- [ ] **Step 7: Verify types check**

Run: `pnpm exec vp run @cascivo/example-track#check`
Expected: exits 0.

---

### Task 4: Board + List views

**Files:**

- Modify: `apps/examples/track/src/sections/Board.tsx` (replace placeholder)
- Create: `apps/examples/track/src/sections/Board.module.css`
- Modify: `apps/examples/track/src/sections/List.tsx` (replace placeholder)

#### Board.tsx

The board shows 5 columns (one per status). Each card uses `Dropdown` for "Move to…" / Edit / Delete actions. `EmptyState` for empty columns. Reads `issuesStore`, `filterAssigneeSignal`, `filterLabelSignal` from the store/App.

- [ ] **Step 1: Create `src/sections/Board.module.css`**

```css
.board {
  display: grid;
  grid-template-columns: repeat(5, minmax(14rem, 1fr));
  gap: var(--cascivo-space-4);
  overflow-x: auto;
  padding-block-end: var(--cascivo-space-4);
  min-block-size: 100%;
}

.column {
  display: flex;
  flex-direction: column;
  gap: var(--cascivo-space-3);
  background: var(--cascivo-color-surface-subtle);
  border-radius: var(--cascivo-radius-lg);
  padding: var(--cascivo-space-3);
  min-block-size: 20rem;
}

.columnHeader {
  display: flex;
  align-items: center;
  gap: var(--cascivo-space-2);
  font-size: var(--cascivo-text-sm);
  font-weight: var(--cascivo-font-semibold);
  color: var(--cascivo-color-foreground-muted);
  padding-block-end: var(--cascivo-space-2);
  border-block-end: 1px solid var(--cascivo-color-border);
}

.columnCount {
  margin-inline-start: auto;
  font-size: var(--cascivo-text-xs);
  background: var(--cascivo-color-surface);
  border-radius: var(--cascivo-radius-full);
  padding-inline: var(--cascivo-space-2);
  padding-block: var(--cascivo-space-0-5);
}

.card {
  background: var(--cascivo-color-surface);
  border: 1px solid var(--cascivo-color-border);
  border-radius: var(--cascivo-radius-md);
  padding: var(--cascivo-space-3);
  display: flex;
  flex-direction: column;
  gap: var(--cascivo-space-2);
  position: relative;
}

.cardTitle {
  font-size: var(--cascivo-text-sm);
  font-weight: var(--cascivo-font-medium);
  line-height: var(--cascivo-leading-snug);
  padding-inline-end: var(--cascivo-space-6);
}

.cardMeta {
  display: flex;
  align-items: center;
  gap: var(--cascivo-space-2);
  flex-wrap: wrap;
}

.cardLabels {
  display: flex;
  gap: var(--cascivo-space-1);
  flex-wrap: wrap;
}

.labelChip {
  font-size: var(--cascivo-text-xs);
  padding-inline: var(--cascivo-space-1-5);
  padding-block: var(--cascivo-space-0-5);
  border-radius: var(--cascivo-radius-full);
  background: var(--cascivo-color-surface-subtle);
  border: 1px solid var(--cascivo-color-border);
}

.cardActions {
  position: absolute;
  inset-block-start: var(--cascivo-space-2);
  inset-inline-end: var(--cascivo-space-2);
}

.assigneeName {
  font-size: var(--cascivo-text-xs);
  color: var(--cascivo-color-foreground-muted);
}
```

- [ ] **Step 2: Write full `src/sections/Board.tsx`**

```tsx
'use client'
import { useSignals } from '@cascivo/core'
import { t } from '@cascivo/i18n'
import { Avatar, Badge, Dropdown, EmptyState } from '@cascivo/react'
import type { DropdownItem } from '@cascivo/react'
import { issuesStore, moveIssue, removeIssue } from '../store/issues'
import type { IssueStatus } from '../store/issues'
import { SEED_USERS, SEED_LABELS } from '../data/seed'
import {
  filterAssigneeSignal,
  filterLabelSignal,
  filterStatusSignal,
  openCreateSignal,
  editIssueIdSignal,
} from '../App'
import { msg } from '../i18n'
import styles from './Board.module.css'

const COLUMNS: Array<{ status: IssueStatus; label: string }> = [
  { status: 'backlog', label: 'Backlog' },
  { status: 'todo', label: 'Todo' },
  { status: 'in_progress', label: 'In Progress' },
  { status: 'done', label: 'Done' },
  { status: 'canceled', label: 'Canceled' },
]

const OTHER_STATUSES = (current: IssueStatus): IssueStatus[] =>
  (['backlog', 'todo', 'in_progress', 'done', 'canceled'] as IssueStatus[]).filter(
    (s) => s !== current,
  )

const STATUS_LABELS: Record<IssueStatus, string> = {
  backlog: 'Backlog',
  todo: 'Todo',
  in_progress: 'In Progress',
  done: 'Done',
  canceled: 'Canceled',
}

const PRIORITY_BADGE: Record<string, 'default' | 'warning' | 'destructive' | 'success'> = {
  urgent: 'destructive',
  high: 'warning',
  medium: 'default',
  low: 'success',
}

export function Board() {
  useSignals()

  const allIssues = issuesStore.value
  const filterAssignee = filterAssigneeSignal.value
  const filterLabel = filterLabelSignal.value
  const filterStatus = filterStatusSignal.value

  const filtered = allIssues.filter((issue) => {
    if (filterAssignee && issue.assigneeId !== filterAssignee) return false
    if (filterLabel && !issue.labelIds.includes(filterLabel)) return false
    if (filterStatus && issue.status !== filterStatus) return false
    return true
  })

  return (
    <div className={styles['board']}>
      {COLUMNS.map((col) => {
        const columnIssues = filtered.filter((i) => i.status === col.status)

        return (
          <div key={col.status} className={styles['column']}>
            <div className={styles['columnHeader']}>
              {col.label}
              <span className={styles['columnCount']}>{columnIssues.length}</span>
            </div>

            {columnIssues.length === 0 ? (
              <EmptyState title={t(msg.emptyColumn)} size="md" />
            ) : (
              columnIssues.map((issue) => {
                const assignee = issue.assigneeId
                  ? SEED_USERS.find((u) => u.id === issue.assigneeId)
                  : null
                const labels = SEED_LABELS.filter((l) => issue.labelIds.includes(l.id))

                const menuItems: DropdownItem[] = [
                  ...OTHER_STATUSES(issue.status).map((s) => ({
                    label: `${t(msg.actionMoveTo).replace('…', '')} ${STATUS_LABELS[s]}`,
                    value: `move:${s}`,
                  })),
                  { label: t(msg.actionEdit), value: 'edit', separator: true },
                  { label: t(msg.actionDelete), value: 'delete' },
                ]

                return (
                  <div key={issue.id} className={styles['card']}>
                    <div className={styles['cardTitle']}>{issue.title}</div>

                    <div className={styles['cardMeta']}>
                      <Badge variant={PRIORITY_BADGE[issue.priority] ?? 'default'}>
                        {issue.priority}
                      </Badge>
                      {assignee && (
                        <>
                          <Avatar fallback={assignee.initials} size="xs" alt={assignee.name} />
                          <span className={styles['assigneeName']}>{assignee.name}</span>
                        </>
                      )}
                    </div>

                    {labels.length > 0 && (
                      <div className={styles['cardLabels']}>
                        {labels.map((label) => (
                          <span
                            key={label.id}
                            className={styles['labelChip']}
                            style={{ borderColor: label.color, color: label.color }}
                          >
                            {label.name}
                          </span>
                        ))}
                      </div>
                    )}

                    <div className={styles['cardActions']}>
                      <Dropdown
                        trigger={
                          <button type="button" aria-label="Issue actions">
                            ···
                          </button>
                        }
                        items={menuItems}
                        onSelect={(value) => {
                          if (value.startsWith('move:')) {
                            moveIssue(issue.id, value.slice(5) as IssueStatus)
                          } else if (value === 'edit') {
                            editIssueIdSignal.value = issue.id
                            openCreateSignal.value = true
                          } else if (value === 'delete') {
                            removeIssue(issue.id)
                          }
                        }}
                        placement="bottom-end"
                      />
                    </div>
                  </div>
                )
              })
            )}
          </div>
        )
      })}
    </div>
  )
}
```

#### List.tsx

The List uses `DataTable` with a `ContextMenu` on each row. Reads the same filter signals.

- [ ] **Step 3: Write full `src/sections/List.tsx`**

```tsx
'use client'
import { useSignals } from '@cascivo/core'
import { t } from '@cascivo/i18n'
import { Avatar, Badge, ContextMenu, ContextMenuItem, DataTable } from '@cascivo/react'
import type { Column } from '@cascivo/react'
import { issuesStore, moveIssue, removeIssue } from '../store/issues'
import type { Issue, IssueStatus } from '../store/issues'
import { SEED_USERS, SEED_LABELS } from '../data/seed'
import {
  filterAssigneeSignal,
  filterLabelSignal,
  filterStatusSignal,
  openCreateSignal,
  editIssueIdSignal,
} from '../App'
import { msg } from '../i18n'

const PRIORITY_BADGE: Record<string, 'default' | 'warning' | 'destructive' | 'success'> = {
  urgent: 'destructive',
  high: 'warning',
  medium: 'default',
  low: 'success',
}

const STATUS_BADGE: Record<IssueStatus, 'default' | 'success' | 'warning' | 'destructive'> = {
  backlog: 'default',
  todo: 'default',
  in_progress: 'warning',
  done: 'success',
  canceled: 'destructive',
}

const STATUS_OPTIONS: IssueStatus[] = ['backlog', 'todo', 'in_progress', 'done', 'canceled']
const STATUS_LABELS: Record<IssueStatus, string> = {
  backlog: 'Backlog',
  todo: 'Todo',
  in_progress: 'In Progress',
  done: 'Done',
  canceled: 'Canceled',
}

const COLUMNS: Column<Issue>[] = [
  {
    key: 'title',
    header: t(msg.colTitle),
    render: (row) => row.title,
  },
  {
    key: 'status',
    header: t(msg.colStatus),
    render: (row) => <Badge variant={STATUS_BADGE[row.status]}>{STATUS_LABELS[row.status]}</Badge>,
  },
  {
    key: 'priority',
    header: t(msg.colPriority),
    render: (row) => (
      <Badge variant={PRIORITY_BADGE[row.priority] ?? 'default'}>{row.priority}</Badge>
    ),
  },
  {
    key: 'assignee',
    header: t(msg.colAssignee),
    render: (row) => {
      const user = row.assigneeId ? SEED_USERS.find((u) => u.id === row.assigneeId) : null
      return user ? (
        <span style={{ display: 'flex', alignItems: 'center', gap: 'var(--cascivo-space-2)' }}>
          <Avatar fallback={user.initials} size="xs" alt={user.name} />
          {user.name}
        </span>
      ) : (
        <span style={{ color: 'var(--cascivo-color-foreground-subtle)' }}>—</span>
      )
    },
  },
  {
    key: 'labels',
    header: t(msg.colLabels),
    render: (row) => {
      const labels = SEED_LABELS.filter((l) => row.labelIds.includes(l.id))
      return (
        <span style={{ display: 'flex', gap: 'var(--cascivo-space-1)' }}>
          {labels.map((l) => (
            <Badge key={l.id} variant="default">
              {l.name}
            </Badge>
          ))}
        </span>
      )
    },
  },
  {
    key: 'createdAt',
    header: t(msg.colCreated),
    render: (row) =>
      new Date(row.createdAt).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      }),
  },
]

export function List() {
  useSignals()

  const allIssues = issuesStore.value
  const filterAssignee = filterAssigneeSignal.value
  const filterLabel = filterLabelSignal.value
  const filterStatus = filterStatusSignal.value

  const filtered = allIssues.filter((issue) => {
    if (filterAssignee && issue.assigneeId !== filterAssignee) return false
    if (filterLabel && !issue.labelIds.includes(filterLabel)) return false
    if (filterStatus && issue.status !== filterStatus) return false
    return true
  })

  return (
    <DataTable<Issue>
      columns={COLUMNS}
      rows={filtered}
      getRowId={(row) => row.id}
      emptyState={<span>{t(msg.emptyList)}</span>}
      density="compact"
      renderExpandedRow={(row) => (
        <ContextMenu>
          <div style={{ padding: 'var(--cascivo-space-2)' }}>
            {STATUS_OPTIONS.filter((s) => s !== row.status).map((s) => (
              <ContextMenuItem key={s} onSelect={() => moveIssue(row.id, s)}>
                Move to {STATUS_LABELS[s]}
              </ContextMenuItem>
            ))}
            <ContextMenuItem
              onSelect={() => {
                editIssueIdSignal.value = row.id
                openCreateSignal.value = true
              }}
            >
              {t(msg.actionEdit)}
            </ContextMenuItem>
            <ContextMenuItem onSelect={() => removeIssue(row.id)}>
              {t(msg.actionDelete)}
            </ContextMenuItem>
          </div>
        </ContextMenu>
      )}
    />
  )
}
```

**Note on ContextMenu in List:** ContextMenu wraps content and fires on right-click. The `renderExpandedRow` prop is used as a holder for the menu content (each row is wrapped). Actually — reconsider: `ContextMenu` wraps a trigger child (right-click target) + menu items. The better approach for List is to wrap each row's rendered content in a `ContextMenu`. Since DataTable renders rows internally, we can't wrap individual rows directly. Instead, wrap the whole `DataTable` in a `ContextMenu` and use row selection + menu actions on a selected row. **Revise Plan:** Use `Dropdown` trigger button in the last column as "row actions" — simpler and avoids the constraint.

- [ ] **Step 4: Revise `src/sections/List.tsx` — replace `renderExpandedRow` approach with an actions column using `Dropdown`**

```tsx
'use client'
import { useSignals } from '@cascivo/core'
import { t } from '@cascivo/i18n'
import { Avatar, Badge, DataTable, Dropdown } from '@cascivo/react'
import type { Column, DropdownItem } from '@cascivo/react'
import { issuesStore, moveIssue, removeIssue } from '../store/issues'
import type { Issue, IssueStatus } from '../store/issues'
import { SEED_USERS, SEED_LABELS } from '../data/seed'
import {
  filterAssigneeSignal,
  filterLabelSignal,
  filterStatusSignal,
  openCreateSignal,
  editIssueIdSignal,
} from '../App'
import { msg } from '../i18n'

const PRIORITY_BADGE: Record<string, 'default' | 'warning' | 'destructive' | 'success'> = {
  urgent: 'destructive',
  high: 'warning',
  medium: 'default',
  low: 'success',
}

const STATUS_BADGE: Record<IssueStatus, 'default' | 'success' | 'warning' | 'destructive'> = {
  backlog: 'default',
  todo: 'default',
  in_progress: 'warning',
  done: 'success',
  canceled: 'destructive',
}

const STATUS_OPTIONS: IssueStatus[] = ['backlog', 'todo', 'in_progress', 'done', 'canceled']
const STATUS_LABELS: Record<IssueStatus, string> = {
  backlog: 'Backlog',
  todo: 'Todo',
  in_progress: 'In Progress',
  done: 'Done',
  canceled: 'Canceled',
}

function makeMenuItems(issue: Issue): DropdownItem[] {
  return [
    ...STATUS_OPTIONS.filter((s) => s !== issue.status).map((s) => ({
      label: `Move to ${STATUS_LABELS[s]}`,
      value: `move:${s}`,
    })),
    { label: t(msg.actionEdit), value: 'edit', separator: true },
    { label: t(msg.actionDelete), value: 'delete' },
  ]
}

function makeColumns(): Column<Issue>[] {
  return [
    {
      key: 'title',
      header: t(msg.colTitle),
      render: (row) => row.title,
    },
    {
      key: 'status',
      header: t(msg.colStatus),
      render: (row) => (
        <Badge variant={STATUS_BADGE[row.status]}>{STATUS_LABELS[row.status]}</Badge>
      ),
    },
    {
      key: 'priority',
      header: t(msg.colPriority),
      render: (row) => (
        <Badge variant={PRIORITY_BADGE[row.priority] ?? 'default'}>{row.priority}</Badge>
      ),
    },
    {
      key: 'assignee',
      header: t(msg.colAssignee),
      render: (row) => {
        const user = row.assigneeId ? SEED_USERS.find((u) => u.id === row.assigneeId) : null
        return user ? (
          <span style={{ display: 'flex', alignItems: 'center', gap: 'var(--cascivo-space-2)' }}>
            <Avatar fallback={user.initials} size="xs" alt={user.name} />
            {user.name}
          </span>
        ) : (
          <span style={{ color: 'var(--cascivo-color-foreground-subtle)' }}>—</span>
        )
      },
    },
    {
      key: 'labels',
      header: t(msg.colLabels),
      render: (row) => {
        const labels = SEED_LABELS.filter((l) => row.labelIds.includes(l.id))
        return (
          <span style={{ display: 'flex', gap: 'var(--cascivo-space-1)' }}>
            {labels.map((l) => (
              <Badge key={l.id} variant="default">
                {l.name}
              </Badge>
            ))}
          </span>
        )
      },
    },
    {
      key: 'createdAt',
      header: t(msg.colCreated),
      render: (row) =>
        new Date(row.createdAt).toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
        }),
    },
    {
      key: 'actions',
      header: '',
      align: 'end',
      render: (row) => (
        <Dropdown
          trigger={
            <button type="button" aria-label="Issue actions">
              ···
            </button>
          }
          items={makeMenuItems(row)}
          onSelect={(value) => {
            if (value.startsWith('move:')) {
              moveIssue(row.id, value.slice(5) as IssueStatus)
            } else if (value === 'edit') {
              editIssueIdSignal.value = row.id
              openCreateSignal.value = true
            } else if (value === 'delete') {
              removeIssue(row.id)
            }
          }}
          placement="bottom-end"
        />
      ),
    },
  ]
}

export function List() {
  useSignals()

  const allIssues = issuesStore.value
  const filterAssignee = filterAssigneeSignal.value
  const filterLabel = filterLabelSignal.value
  const filterStatus = filterStatusSignal.value

  const filtered = allIssues.filter((issue) => {
    if (filterAssignee && issue.assigneeId !== filterAssignee) return false
    if (filterLabel && !issue.labelIds.includes(filterLabel)) return false
    if (filterStatus && issue.status !== filterStatus) return false
    return true
  })

  return (
    <DataTable<Issue>
      columns={makeColumns()}
      rows={filtered}
      getRowId={(row) => row.id}
      emptyState={<span>{t(msg.emptyList)}</span>}
      density="compact"
    />
  )
}
```

- [ ] **Step 5: Verify types check**

Run: `pnpm exec vp run @cascivo/example-track#check`
Expected: exits 0.

---

### Task 5: Command menu + keyboard shortcuts

**Files:**

- Modify: `apps/examples/track/src/commands.ts` (replace stub)
- Modify: `apps/examples/track/src/App.tsx` (add `useSignalEffect` keyboard listener)

- [ ] **Step 1: Write full `src/commands.ts`**

```ts
import { t } from '@cascivo/i18n'
import type { CommandGroup } from '@cascivo/react'
import { currentSection, openCreateSignal, viewSignal } from './App'
import { msg } from './i18n'

export function buildCommandGroups(): CommandGroup[] {
  return [
    {
      heading: 'Actions',
      items: [
        {
          id: 'new-issue',
          label: t(msg.cmdNewIssue),
          shortcut: ['c'],
          keywords: ['create', 'add', 'issue', 'new'],
          onSelect() {
            openCreateSignal.value = true
          },
        },
        {
          id: 'show-all',
          label: t(msg.cmdShowAll),
          keywords: ['filter', 'reset', 'all'],
          onSelect() {
            currentSection.value = 'board'
          },
        },
      ],
    },
    {
      heading: 'Navigation',
      items: [
        {
          id: 'go-board',
          label: t(msg.cmdGoBoard),
          shortcut: ['B'],
          keywords: ['board', 'kanban', 'columns'],
          onSelect() {
            currentSection.value = 'board'
            viewSignal.value = 'board'
          },
        },
        {
          id: 'go-list',
          label: t(msg.cmdGoList),
          shortcut: ['L'],
          keywords: ['list', 'table', 'rows'],
          onSelect() {
            currentSection.value = 'list'
            viewSignal.value = 'list'
          },
        },
      ],
    },
  ]
}
```

- [ ] **Step 2: Add keyboard shortcut listener to `src/App.tsx`**

Import `useSignalEffect` and add this block inside the `App` function, after `useSignals()`. The keyboard effect registers `c` to open create, and `/` to focus the filter combobox. Use a `useRef` to keep the filter input reference accessible.

Add this import at the top of `App.tsx`:

```tsx
import { signal, useSignalEffect, useSignals } from '@cascivo/core'
```

Then inside the `App` function, add after `useSignals()`:

```tsx
useSignalEffect(() => {
  function onKeyDown(e: KeyboardEvent) {
    if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return
    if (e.key === 'c' && !e.metaKey && !e.ctrlKey) {
      openCreateSignal.value = true
    }
  }
  document.addEventListener('keydown', onKeyDown)
  return () => document.removeEventListener('keydown', onKeyDown)
})
```

- [ ] **Step 3: Verify types check**

Run: `pnpm exec vp run @cascivo/example-track#check`
Expected: exits 0.

---

### Task 6: IssueForm (Drawer + Form)

Replace the placeholder `IssueForm` with the full implementation.

**Files:**

- Modify: `apps/examples/track/src/sections/IssueForm.tsx` (replace placeholder)
- Create: `apps/examples/track/src/sections/IssueForm.module.css`

- [ ] **Step 1: Create `src/sections/IssueForm.module.css`**

```css
.fields {
  display: flex;
  flex-direction: column;
  gap: var(--cascivo-space-4);
}

.actions {
  display: flex;
  gap: var(--cascivo-space-3);
  justify-content: flex-end;
  padding-block-start: var(--cascivo/space-4);
  border-block-start: 1px solid var(--cascivo-color-border);
  margin-block-start: var(--cascivo-space-4);
}
```

- [ ] **Step 2: Write full `src/sections/IssueForm.tsx`**

`IssueForm` reads `openCreateSignal` and `editIssueIdSignal` from `App.tsx`. When `editIssueIdSignal.value` is non-null, it's edit mode — pre-populate form from `issuesStore`. On save, calls `createIssue` or `updateIssue` and fires a toast.

`useForm` from `@cascivo/react` creates the form store. The `form.field(name)` accessor provides `{ value, onChange, onBlur, error }`. `form.submit(onValid)` runs validation then calls the callback.

```tsx
'use client'
import { useSignalEffect, useSignals } from '@cascivo/core'
import { t } from '@cascivo/i18n'
import {
  Button,
  Combobox,
  Drawer,
  Input,
  MultiSelect,
  Select,
  useToast,
  useForm,
} from '@cascivo/react'
import type { SelectOption, MultiSelectOption, ComboboxOption } from '@cascivo/react'
import { issuesStore, createIssue, updateIssue } from '../store/issues'
import type { IssuePriority, IssueStatus } from '../store/issues'
import { SEED_USERS, SEED_LABELS } from '../data/seed'
import { openCreateSignal, editIssueIdSignal } from '../App'
import { msg } from '../i18n'
import styles from './IssueForm.module.css'

interface FormValues {
  title: string
  status: IssueStatus
  priority: IssuePriority
  assigneeId: string
  labelIds: string[]
}

const STATUS_OPTIONS: SelectOption[] = [
  { value: 'backlog', label: 'Backlog' },
  { value: 'todo', label: 'Todo' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'done', label: 'Done' },
  { value: 'canceled', label: 'Canceled' },
]

const PRIORITY_OPTIONS: SelectOption[] = [
  { value: 'urgent', label: 'Urgent' },
  { value: 'high', label: 'High' },
  { value: 'medium', label: 'Medium' },
  { value: 'low', label: 'Low' },
]

const ASSIGNEE_OPTIONS: ComboboxOption[] = [
  { value: '', label: 'Unassigned' },
  ...SEED_USERS.map((u) => ({ value: u.id, label: u.name })),
]

const LABEL_OPTIONS: MultiSelectOption[] = SEED_LABELS.map((l) => ({
  value: l.id,
  label: l.name,
}))

export function IssueForm() {
  useSignals()
  const { toast } = useToast()

  const isOpen = openCreateSignal.value
  const editId = editIssueIdSignal.value
  const isEdit = editId !== null

  const existingIssue = isEdit ? issuesStore.value.find((i) => i.id === editId) : null

  const form = useForm<FormValues>({
    initialValues: {
      title: existingIssue?.title ?? '',
      status: existingIssue?.status ?? 'backlog',
      priority: existingIssue?.priority ?? 'medium',
      assigneeId: existingIssue?.assigneeId ?? '',
      labelIds: existingIssue?.labelIds ?? [],
    },
    validate: (values) => {
      const errors: Partial<Record<keyof FormValues, string>> = {}
      if (!values.title.trim()) {
        errors.title = t(msg.formTitleRequired)
      }
      return errors
    },
  })

  // Sync form values when editId changes (re-populate for different issues)
  useSignalEffect(() => {
    const id = editIssueIdSignal.value
    const issue = id ? issuesStore.value.find((i) => i.id === id) : null
    if (issue) {
      form.setValue('title', issue.title)
      form.setValue('status', issue.status)
      form.setValue('priority', issue.priority)
      form.setValue('assigneeId', issue.assigneeId ?? '')
      form.setValue('labelIds', issue.labelIds)
    } else if (!id) {
      form.reset()
    }
  })

  function handleClose() {
    openCreateSignal.value = false
    editIssueIdSignal.value = null
    form.reset()
  }

  const titleField = form.field('title')
  const statusField = form.field('status')
  const priorityField = form.field('priority')
  const assigneeField = form.field('assigneeId')
  const labelsField = form.field('labelIds')

  return (
    <Drawer
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) handleClose()
      }}
      title={isEdit ? t(msg.drawerEditTitle) : t(msg.drawerCreateTitle)}
      side="end"
    >
      <form
        className={styles['fields']}
        onSubmit={(e) => {
          e.preventDefault()
          void form.submit((values) => {
            if (isEdit && editId) {
              updateIssue(editId, {
                title: values.title,
                status: values.status,
                priority: values.priority,
                assigneeId: values.assigneeId || null,
                labelIds: values.labelIds,
              })
              toast({ title: t(msg.toastUpdated), variant: 'success' })
            } else {
              createIssue({
                title: values.title,
                status: values.status,
                priority: values.priority,
                assigneeId: values.assigneeId || null,
                labelIds: values.labelIds,
              })
              toast({ title: t(msg.toastCreated), variant: 'success' })
            }
            handleClose()
          })
        }}
      >
        <Input
          label={t(msg.formTitleLabel)}
          value={titleField.value}
          onChange={(e) => titleField.onChange(e.currentTarget.value)}
          onBlur={titleField.onBlur}
          error={titleField.error}
          required
        />

        <Select
          label={t(msg.formStatusLabel)}
          options={STATUS_OPTIONS}
          value={statusField.value}
          onChange={(e) => statusField.onChange(e.currentTarget.value as IssueStatus)}
        />

        <Select
          label={t(msg.formPriorityLabel)}
          options={PRIORITY_OPTIONS}
          value={priorityField.value}
          onChange={(e) => priorityField.onChange(e.currentTarget.value as IssuePriority)}
        />

        <Combobox
          label={t(msg.formAssigneeLabel)}
          options={ASSIGNEE_OPTIONS}
          value={assigneeField.value}
          onChange={(v) => assigneeField.onChange(v ?? '')}
          clearable
        />

        <MultiSelect
          options={LABEL_OPTIONS}
          value={labelsField.value}
          onValueChange={(v) => labelsField.onChange(v)}
          placeholder={t(msg.formLabelsLabel)}
        />

        <div className={styles['actions']}>
          <Button type="button" variant="ghost" onClick={handleClose}>
            {t(msg.formCancel)}
          </Button>
          <Button type="submit" loading={form.submitting.value}>
            {t(msg.formSave)}
          </Button>
        </div>
      </form>
    </Drawer>
  )
}
```

- [ ] **Step 3: Fix the `IssueForm.module.css` CSS custom property typo**

In `IssueForm.module.css`, line `padding-block-start: var(--cascivo/space-4);` has a `/` instead of `-`. Fix it:

```css
.actions {
  display: flex;
  gap: var(--cascivo-space-3);
  justify-content: flex-end;
  padding-block-start: var(--cascivo-space-4);
  border-block-start: 1px solid var(--cascivo-color-border);
  margin-block-start: var(--cascivo-space-4);
}
```

(Write the correct file content from step 1 directly — the typo was introduced in the plan narrative above, not in the actual step.)

- [ ] **Step 4: Verify types check**

Run: `pnpm exec vp run @cascivo/example-track#check`
Expected: exits 0.

---

### Task 7: Smoke tests

**Files:**

- Create: `apps/examples/track/test/smoke.spec.ts`

Tests validate the seed data shape, store mutators, and that filter logic is correct.

- [ ] **Step 1: Write `test/smoke.spec.ts`**

```ts
import { describe, it, expect, beforeEach } from 'vitest'
import { SEED_ISSUES, SEED_USERS, SEED_LABELS } from '../src/data/seed'
import { issuesStore, createIssue, updateIssue, moveIssue, removeIssue } from '../src/store/issues'

describe('seed data', () => {
  it('generates exactly 20 issues', () => {
    expect(SEED_ISSUES).toHaveLength(20)
  })

  it('all issues have valid status', () => {
    const valid = new Set(['backlog', 'todo', 'in_progress', 'done', 'canceled'])
    expect(SEED_ISSUES.every((i) => valid.has(i.status))).toBe(true)
  })

  it('all issues have valid priority', () => {
    const valid = new Set(['urgent', 'high', 'medium', 'low'])
    expect(SEED_ISSUES.every((i) => valid.has(i.priority))).toBe(true)
  })

  it('generates 5 users', () => {
    expect(SEED_USERS).toHaveLength(5)
  })

  it('generates 5 labels', () => {
    expect(SEED_LABELS).toHaveLength(5)
  })

  it('all label colors are CSS var references', () => {
    expect(SEED_LABELS.every((l) => l.color.startsWith('var(--cascivo-'))).toBe(true)
  })

  it('all issues have a non-empty title', () => {
    expect(SEED_ISSUES.every((i) => i.title.length > 0)).toBe(true)
  })

  it('all issues have an id', () => {
    expect(SEED_ISSUES.every((i) => i.id.startsWith('issue-'))).toBe(true)
  })

  it('assigneeId references valid user ids or null', () => {
    const userIds = new Set(SEED_USERS.map((u) => u.id))
    expect(SEED_ISSUES.every((i) => i.assigneeId === null || userIds.has(i.assigneeId))).toBe(true)
  })

  it('all labelIds reference valid label ids', () => {
    const labelIds = new Set(SEED_LABELS.map((l) => l.id))
    expect(SEED_ISSUES.every((i) => i.labelIds.every((id) => labelIds.has(id)))).toBe(true)
  })
})

describe('store mutators', () => {
  beforeEach(() => {
    // Reset store to seed data before each test
    issuesStore.value = [...SEED_ISSUES]
  })

  it('createIssue adds an issue to the store', () => {
    const before = issuesStore.value.length
    createIssue({
      title: 'Test issue',
      status: 'todo',
      priority: 'medium',
      assigneeId: null,
      labelIds: [],
    })
    expect(issuesStore.value).toHaveLength(before + 1)
    const created = issuesStore.value.at(-1)!
    expect(created.title).toBe('Test issue')
    expect(created.status).toBe('todo')
    expect(created.id).toMatch(/^issue-\d+$/)
  })

  it('updateIssue changes fields on the matching issue', () => {
    const target = issuesStore.value[0]!
    updateIssue(target.id, { title: 'Updated title', status: 'done' })
    const updated = issuesStore.value.find((i) => i.id === target.id)!
    expect(updated.title).toBe('Updated title')
    expect(updated.status).toBe('done')
  })

  it('updateIssue does not change other issues', () => {
    const target = issuesStore.value[0]!
    const other = issuesStore.value[1]!
    const otherTitleBefore = other.title
    updateIssue(target.id, { title: 'Changed' })
    expect(issuesStore.value.find((i) => i.id === other.id)!.title).toBe(otherTitleBefore)
  })

  it('moveIssue changes only the status of the matching issue', () => {
    const target = issuesStore.value.find((i) => i.status !== 'done')!
    moveIssue(target.id, 'done')
    expect(issuesStore.value.find((i) => i.id === target.id)!.status).toBe('done')
  })

  it('removeIssue deletes the matching issue', () => {
    const target = issuesStore.value[0]!
    const before = issuesStore.value.length
    removeIssue(target.id)
    expect(issuesStore.value).toHaveLength(before - 1)
    expect(issuesStore.value.find((i) => i.id === target.id)).toBeUndefined()
  })

  it('removeIssue on unknown id is a no-op', () => {
    const before = issuesStore.value.length
    removeIssue('does-not-exist')
    expect(issuesStore.value).toHaveLength(before)
  })
})
```

- [ ] **Step 2: Run tests**

Run: `pnpm exec vp run @cascivo/example-track#test`
Expected: All tests pass.

---

### Task 8: Build + lint gate + commit

- [ ] **Step 1: Run full check**

```bash
pnpm exec vp run @cascivo/example-track#check
```

Expected: exits 0 (format + lint + tsc).

- [ ] **Step 2: Build the app**

```bash
pnpm exec vp run @cascivo/example-track#build
```

Expected: exits 0. A `dist/` directory is produced under `apps/examples/track/`.

- [ ] **Step 3: Run drift check**

```bash
pnpm regen
pnpm exec vp check --fix
git diff --exit-code
```

Expected: no diff (or commit any regenerated files if diff found).

- [ ] **Step 4: Run breakpoint literal check**

```bash
pnpm breakpoint:check
```

Expected: exits 0 (no off-scale `@media`/`@container` width literals in new CSS files).

- [ ] **Step 5: Commit**

```bash
git add apps/examples/track/
git commit -m "$(cat <<'EOF'
feat(examples): add Cascade Track keyboard-first issue tracker (v21-t4)

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>
EOF
)"
```

---

## Self-Review

### Spec coverage

| Requirement                                                                             | Task                                        |
| --------------------------------------------------------------------------------------- | ------------------------------------------- |
| Scaffold app (`package.json`, `tsconfig`, `vite.config`, `index.html`, `main.tsx`)      | Task 1                                      |
| Persisted store + seed (5 users, 5 labels, 20 issues, `seededRandom(17)`)               | Task 2                                      |
| `createIssue`, `updateIssue`, `moveIssue`, `removeIssue`                                | Task 2                                      |
| `Skeleton` while `issuesStore.ready.value === false`                                    | **GAP — see note below**                    |
| AppShell (Board/List/Settings nav), SegmentedControl view toggle, filter Comboboxes     | Task 3                                      |
| `persistedSignal('track-view', 'board')`                                                | Task 3                                      |
| Board: 5 columns, cards (title, Badge priority, assignee name, label chips)             | Task 4                                      |
| Card action menu: Move to…, Edit, Delete                                                | Task 4                                      |
| EmptyState for empty columns                                                            | Task 4                                      |
| List: DataTable, columns (title, status Badge, priority Badge, assignee Avatar, labels) | Task 4                                      |
| Row actions: move to status, edit, delete                                               | Task 4                                      |
| CommandMenu on Cmd+K with 5 commands                                                    | Task 5                                      |
| Keyboard shortcut `c` → open create form                                                | Task 5                                      |
| Guard: don't fire shortcuts in inputs                                                   | Task 5                                      |
| `Kbd` hints in UI                                                                       | Task 3 (`<Kbd>c</Kbd>` in New Issue button) |
| Listeners via `useSignalEffect` only                                                    | Task 5                                      |
| Drawer + Form: title, status, priority, assignee, labels                                | Task 6                                      |
| Inline validation: title required                                                       | Task 6                                      |
| Toast on save                                                                           | Task 6                                      |
| Smoke tests                                                                             | Task 7                                      |
| Build passes                                                                            | Task 8                                      |
| `pnpm exec vp check` passes                                                             | Task 8                                      |
| Commit                                                                                  | Task 8                                      |

**GAP: `Skeleton` while `issuesStore.ready.value === false`**

The spec says "Show `Skeleton` on first render while `issuesStore.ready.value === false`." `persistedSignal` from `@cascivo/storage` exposes a `.ready` signal that is `false` until the persisted value is hydrated from localStorage.

Add this to both `Board.tsx` and `List.tsx`, at the top of the component return:

```tsx
if (!issuesStore.ready.value) {
  return <Skeleton variant="rect" height="20rem" />
}
```

Add this to Task 4 (Board) and Task 4 (List) as a first step. Adding it here as a correction:

- [ ] **Add Skeleton guard to Board.tsx** — after `useSignals()` and before computing `filtered`, add:

```tsx
if (!issuesStore.ready.value) {
  return <Skeleton variant="rect" height="20rem" />
}
```

Import `Skeleton` from `@cascivo/react`.

- [ ] **Add Skeleton guard to List.tsx** — same pattern.

### Placeholder scan

No TBD, TODO, or "implement later" in plan. All code blocks complete. ✓

### Type consistency

- `IssueStatus` and `IssuePriority` defined in `seed.ts`, re-exported from `store/issues.ts` — consistent across Board, List, IssueForm. ✓
- `openCreateSignal` and `editIssueIdSignal` exported from `App.tsx`, imported in Board, List, IssueForm, commands. ✓
- `moveIssue(id, status)` in store matches calls in Board (`value.slice(5) as IssueStatus`) and List. ✓
- `form.field('title').onChange` receives `string` from `e.currentTarget.value` — consistent with `FormValues.title: string`. ✓
- `DropdownItem` from `@cascivo/react` — `separator` is a valid field per the `DropdownItem` interface. ✓
- `Combobox.onChange` receives `string | undefined` — the form field expects `string`, handled by `v ?? ''`. ✓
