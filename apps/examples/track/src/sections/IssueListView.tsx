'use client'
import { useSignals, useComputed } from '@cascivo/core'
import { t } from '@cascivo/i18n'
import {
  Breadcrumb,
  Badge,
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
  Tooltip,
} from '@cascivo/react'
import { issues } from '../store/issues'
import { issueTab, assigneeFilter } from '../App'
import { IssueRow } from './IssueRow'
import { msg } from '../i18n'
import styles from './IssueListView.module.css'

const ACTIVE_STATUSES = new Set(['todo', 'in-progress', 'in-review'])
const BACKLOG_STATUSES = new Set(['backlog'])

export function IssueListView() {
  useSignals()

  const filtered = useComputed(() => {
    const all = issues.value
    const filter = assigneeFilter.value
    const tab = issueTab.value
    return all
      .filter((i) => (filter ? i.assigneeId === filter : true))
      .filter((i) => {
        if (tab === 'active') return ACTIVE_STATUSES.has(i.status)
        if (tab === 'backlog') return BACKLOG_STATUSES.has(i.status)
        return true
      })
  })

  const teamName = t(msg.navTeamName)
  const issueCount = filtered.value.length

  return (
    <div className={styles['root']}>
      <header className={styles['header']}>
        <div className={styles['breadcrumbWrap']}>
          <Breadcrumb items={[{ label: teamName }, { label: t(msg.navSubIssues) }]} />
          <Badge size="sm" variant="secondary">
            {issueCount}
          </Badge>
        </div>
        <div className={styles['headerActions']}>
          <Tooltip content={t(msg.toolbarFilter)}>
            <button type="button" className={styles['iconBtn']} aria-label={t(msg.toolbarFilter)}>
              ⊟
            </button>
          </Tooltip>
          <Tooltip content={t(msg.toolbarSort)}>
            <button type="button" className={styles['iconBtn']} aria-label={t(msg.toolbarSort)}>
              ↕
            </button>
          </Tooltip>
        </div>
      </header>

      <Tabs
        value={issueTab.value}
        onValueChange={(v) => {
          issueTab.value = v as typeof issueTab.value
        }}
      >
        <TabsList>
          <TabsTrigger value="all">{t(msg.issueTabAll)}</TabsTrigger>
          <TabsTrigger value="active">{t(msg.issueTabActive)}</TabsTrigger>
          <TabsTrigger value="backlog">{t(msg.issueTabBacklog)}</TabsTrigger>
        </TabsList>

        <div className={styles['teamHeader']}>{teamName}</div>
        {(['all', 'active', 'backlog'] as const).map((tab) => (
          <TabsContent key={tab} value={tab}>
            <div className={styles['issueList']}>
              {filtered.value.length === 0 ? (
                <p className={styles['empty']}>{t(msg.listEmpty)}</p>
              ) : (
                filtered.value.map((issue, i) => (
                  <IssueRow key={issue.id} issue={issue} index={i + 1} />
                ))
              )}
            </div>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  )
}
