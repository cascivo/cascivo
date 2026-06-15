'use client'
import { signal, useSignals, useComputed } from '@cascivo/core'
import { t } from '@cascivo/i18n'
import { Select, Search, Button, EmptyState } from '@cascivo/react'
import { deployMsg } from '../../i18n'
import styles from './Deployments.module.css'

const dateRangeFilter = signal<string>('all')
const authorFilter = signal<string>('all')
const envFilter = signal<string>('all')
const repoFilter = signal<string>('all')
const branchSearch = signal<string>('')

function clearFilters() {
  dateRangeFilter.value = 'all'
  authorFilter.value = 'all'
  envFilter.value = 'all'
  repoFilter.value = 'all'
  branchSearch.value = ''
}

const DATE_OPTIONS = [
  { value: 'all', label: 'Select Date Range' },
  { value: '24h', label: 'Last 24 hours' },
  { value: '7d', label: 'Last 7 days' },
  { value: '30d', label: 'Last 30 days' },
]

const AUTHOR_OPTIONS = [{ value: 'all', label: 'All Authors' }]
const ENV_OPTIONS = [
  { value: 'all', label: 'All Environments' },
  { value: 'production', label: 'Production' },
  { value: 'preview', label: 'Preview' },
]
const REPO_OPTIONS = [{ value: 'all', label: 'All Repositories' }]

const MOCK_DEPLOYMENTS = [
  { id: 'd1', branch: 'main', status: 'ready', author: 'adam', env: 'production', repo: 'cascivo' },
  {
    id: 'd2',
    branch: 'feature/t9',
    status: 'building',
    author: 'adam',
    env: 'preview',
    repo: 'cascivo',
  },
  { id: 'd3', branch: 'fix/css', status: 'error', author: 'adam', env: 'preview', repo: 'cascivo' },
]

export function Deployments() {
  useSignals()

  const filtered = useComputed(() => {
    const q = branchSearch.value.toLowerCase()
    return MOCK_DEPLOYMENTS.filter(
      (d) =>
        (q === '' || d.branch.includes(q)) &&
        (authorFilter.value === 'all' || d.author === authorFilter.value) &&
        (envFilter.value === 'all' || d.env === envFilter.value) &&
        (repoFilter.value === 'all' || d.repo === repoFilter.value),
    )
  })

  return (
    <div className={styles['root']}>
      <div className={styles['filterBar']}>
        <Select
          options={DATE_OPTIONS}
          value={dateRangeFilter.value}
          onChange={(v) => {
            dateRangeFilter.value = v
          }}
          aria-label={t(deployMsg.deplFilterDateLabel)}
        />
        <Select
          options={AUTHOR_OPTIONS}
          value={authorFilter.value}
          onChange={(v) => {
            authorFilter.value = v
          }}
          aria-label={t(deployMsg.deplFilterAuthorsLabel)}
        />
        <Select
          options={ENV_OPTIONS}
          value={envFilter.value}
          onChange={(v) => {
            envFilter.value = v
          }}
          aria-label={t(deployMsg.deplFilterEnvsLabel)}
        />
        <Select
          options={REPO_OPTIONS}
          value={repoFilter.value}
          onChange={(v) => {
            repoFilter.value = v
          }}
          aria-label={t(deployMsg.deplFilterReposLabel)}
        />
        <Search
          placeholder={t(deployMsg.deplFilterBranchPlaceholder)}
          value={branchSearch.value}
          onChange={(v) => {
            branchSearch.value = v
          }}
        />
      </div>

      {filtered.value.length === 0 ? (
        <EmptyState
          title={t(deployMsg.deplNoResults)}
          description={t(deployMsg.deplNoResultsDesc)}
          action={
            <Button variant="secondary" size="sm" onClick={clearFilters}>
              {t(deployMsg.deplClearFilters)}
            </Button>
          }
        />
      ) : (
        <div className={styles['list']}>
          {filtered.value.map((d) => (
            <div key={d.id} className={styles['row']}>
              <span className={styles['branch']}>{d.branch}</span>
              <span className={styles['env']}>{d.env}</span>
              <span className={styles['status']}>{d.status}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
