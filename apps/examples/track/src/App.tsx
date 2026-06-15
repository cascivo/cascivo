'use client'
import { signal, useSignalEffect, useSignals } from '@cascivo/core'
import { t } from '@cascivo/i18n'
import {
  ToastProvider,
  Button,
  Combobox,
  Badge,
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
  SegmentedControl,
} from '@cascivo/react'
import type { SideNavGroup } from '@cascivo/react'
import { persistedSignal } from '@cascivo/storage'
import { AppShell } from '@cascivo/example-kit'
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

export const currentView = persistedSignal<View>('track-view', 'board')
export const assigneeFilter = signal<string | undefined>(undefined)
export const currentSection = signal<'issues' | 'settings'>('issues')
export const issueTab = signal<'all' | 'active' | 'backlog'>('all')

const VIEW_OPTIONS = [
  { label: 'Board', value: 'board' as View },
  { label: 'List', value: 'list' as View },
]

export default function App() {
  useSignals()

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

  const notifBadge = (
    <Badge size="sm" variant="destructive">
      {t(msg.notifCount)}
    </Badge>
  )

  const navGroups: SideNavGroup[] = [
    {
      items: [
        {
          label: t(msg.navInbox),
          active: false,
          onClick: (e) => {
            e.preventDefault()
          },
        },
        {
          label: t(msg.navMyIssues),
          active: false,
          onClick: (e) => {
            e.preventDefault()
          },
        },
        {
          label: t(msg.navNotifications),
          active: false,
          icon: notifBadge,
          onClick: (e) => {
            e.preventDefault()
          },
        },
      ],
    },
    {
      label: t(msg.navGroupFavorites),
      items: [],
    },
    {
      label: t(msg.navGroupTeams),
      items: [
        {
          label: t(msg.navTeamName),
          active: currentSection.value === 'issues',
          items: [
            {
              label: t(msg.navSubIssues),
              href: '#',
              active: currentSection.value === 'issues',
            },
            { label: t(msg.navSubCycles), href: '#', active: false },
            { label: t(msg.navSubProjects), href: '#', active: false },
            { label: t(msg.navSubViews), href: '#', active: false },
            { label: t(msg.navSubPages), href: '#', active: false },
          ],
          onClick: (e) => {
            e.preventDefault()
            currentSection.value = 'issues'
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
      ],
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
      <AppShell navGroups={navGroups} actions={actions} mockBanner>
        {currentSection.value === 'settings' ? (
          <div style={{ padding: 'var(--cascivo-space-6)' }}>
            <p style={{ color: 'var(--cascivo-color-foreground-muted)' }}>
              Settings — coming in T7
            </p>
          </div>
        ) : currentView.value === 'board' ? (
          <Board />
        ) : (
          <Tabs
            value={issueTab.value}
            onValueChange={(v) => {
              issueTab.value = v as 'all' | 'active' | 'backlog'
            }}
          >
            <TabsList>
              <TabsTrigger value="all">{t(msg.issueTabAll)}</TabsTrigger>
              <TabsTrigger value="active">{t(msg.issueTabActive)}</TabsTrigger>
              <TabsTrigger value="backlog">{t(msg.issueTabBacklog)}</TabsTrigger>
            </TabsList>
            <TabsContent value="all">
              <List />
            </TabsContent>
            <TabsContent value="active">
              <List />
            </TabsContent>
            <TabsContent value="backlog">
              <List />
            </TabsContent>
          </Tabs>
        )}
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
