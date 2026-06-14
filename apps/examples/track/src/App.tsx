'use client'
import { signal, useSignalEffect, useSignals } from '@cascivo/core'
import { t } from '@cascivo/i18n'
import { ToastProvider, Button, Combobox } from '@cascivo/react'
import { SegmentedControl } from '@cascivo/react'
import { persistedSignal } from '@cascivo/storage'
import { AppShell } from '@cascivo/example-kit'
import type { SideNavItem } from '@cascivo/react'
import { Board } from './sections/Board'
import { List } from './sections/List'
import { IssueForm } from './sections/IssueForm'
import { msg } from './i18n'
import { USERS } from './data/seed'
import { newIssueOpen, editingIssueId } from './commands'

import '@cascivo/themes/dark'
import '@cascivo/themes/light'
import '@cascivo/themes/warm'
import '@cascivo/tokens'

type View = 'board' | 'list'

// Module-level signals
export const currentView = persistedSignal<View>('track-view', 'board')
export const assigneeFilter = signal<string | undefined>(undefined)

const VIEW_OPTIONS = [
  { label: 'Board', value: 'board' as View },
  { label: 'List', value: 'list' as View },
]

export default function App() {
  useSignals()

  // Keyboard shortcut: C = new issue, Escape handled per-component
  useSignalEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement
      const isInput =
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.tagName === 'SELECT' ||
        target.isContentEditable
      if (isInput) return
      if (e.key === 'c' || e.key === 'C') {
        newIssueOpen.value = true
      }
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  })

  const assigneeOptions = [
    { value: '__all__', label: t(msg.toolbarFilterAll) },
    ...USERS.map((u) => ({ value: u.id, label: u.name })),
  ]

  const navItems: SideNavItem[] = [
    {
      label: t(msg.navBoard),
      active: currentView.value === 'board',
      onClick: (e) => {
        e.preventDefault()
        currentView.value = 'board'
      },
    },
    {
      label: t(msg.navList),
      active: currentView.value === 'list',
      onClick: (e) => {
        e.preventDefault()
        currentView.value = 'list'
      },
    },
  ]

  const actions = (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 'var(--cascivo-space-3)',
      }}
    >
      <Combobox
        options={assigneeOptions}
        value={assigneeFilter.value ?? '__all__'}
        onChange={(v) => {
          assigneeFilter.value = v === '__all__' ? undefined : v
        }}
        searchable={false}
        size="sm"
      />
      <SegmentedControl
        options={VIEW_OPTIONS}
        value={currentView.value}
        onValueChange={(v) => {
          currentView.value = v as View
        }}
        size="sm"
      />
      <Button
        size="sm"
        onClick={() => {
          newIssueOpen.value = true
        }}
      >
        {t(msg.toolbarNewIssue)}
      </Button>
    </div>
  )

  return (
    <ToastProvider>
      <AppShell navItems={navItems} actions={actions} mockBanner>
        {currentView.value === 'board' ? <Board /> : <List />}
      </AppShell>
      <IssueForm
        open={newIssueOpen.value || editingIssueId.value !== null}
        issueId={editingIssueId.value}
        onClose={() => {
          newIssueOpen.value = false
          editingIssueId.value = null
        }}
      />
    </ToastProvider>
  )
}
