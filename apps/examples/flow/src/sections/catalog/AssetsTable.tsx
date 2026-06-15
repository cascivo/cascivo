'use client'
import { signal, useSignals, useComputed } from '@cascivo/core'
import { t } from '@cascivo/i18n'
import { Badge, DataTable, Search, Select, EmptyState } from '@cascivo/react'
import type { Column } from '@cascivo/react'
import { CATALOG_ASSETS } from '../../data/catalog'
import type { CatalogAsset, AssetStatus } from '../../data/catalog'
import { msg } from '../../i18n'
import styles from './AssetsTable.module.css'

const searchSignal = signal('')
const statusFilterSignal = signal<AssetStatus | 'all'>('all')

function onLatestVariant(onLatest: number, total: number): 'success' | 'warning' | 'destructive' {
  const ratio = total === 0 ? 0 : onLatest / total
  if (ratio >= 0.8) return 'success'
  if (ratio >= 0.4) return 'warning'
  return 'destructive'
}

function statusVariant(status: AssetStatus): 'success' | 'warning' | 'destructive' {
  if (status === 'up-to-date') return 'success'
  if (status === 'outdated') return 'warning'
  return 'destructive'
}

function statusLabel(status: AssetStatus): string {
  if (status === 'up-to-date') return t(msg.assetStatusUpToDate)
  if (status === 'outdated') return t(msg.assetStatusOutdated)
  return t(msg.assetStatusUnavailable)
}

const COLUMNS_TAIL: Column<CatalogAsset>[] = [
  {
    key: 'workspaces',
    header: t(msg.colWorkspaces),
    render: (row) => row.workspaces,
  },
  {
    key: 'projects',
    header: t(msg.colProjects),
    render: (row) => row.projects,
  },
  {
    key: 'latestVersion',
    header: t(msg.colLatestVersion),
    render: (row) => <span className={styles['mono']}>{row.latestVersion}</span>,
  },
  {
    key: 'onLatest',
    header: t(msg.colOnLatest),
    render: (row) => (
      <Badge size="sm" variant={onLatestVariant(row.onLatest, row.total)}>
        {row.onLatest} / {row.total}
      </Badge>
    ),
  },
  {
    key: 'status',
    header: t(msg.colStatus),
    render: (row) => (
      <Badge size="sm" variant={statusVariant(row.status)}>
        {statusLabel(row.status)}
      </Badge>
    ),
  },
  {
    key: 'lastUpdated',
    header: t(msg.colLastUpdated),
    render: (row) => row.lastUpdated,
  },
]

interface Props {
  onSelect?: (id: string) => void
}

export function AssetsTable({ onSelect }: Props) {
  useSignals()

  const columns: Column<CatalogAsset>[] = [
    {
      key: 'name',
      header: t(msg.colAssetName),
      render: (row) =>
        onSelect ? (
          <button type="button" className={styles['assetName']} onClick={() => onSelect(row.id)}>
            <span className={styles['assetIcon']}>{row.icon}</span>
            {row.name}
          </button>
        ) : (
          <span className={styles['assetName']}>
            <span className={styles['assetIcon']}>{row.icon}</span>
            {row.name}
          </span>
        ),
    },
    ...COLUMNS_TAIL,
  ]

  const filteredRows = useComputed(() => {
    const q = searchSignal.value.toLowerCase()
    const st = statusFilterSignal.value
    return CATALOG_ASSETS.filter(
      (a) => (st === 'all' || a.status === st) && (q === '' || a.name.toLowerCase().includes(q)),
    )
  })

  const STATUS_OPTIONS = [
    { value: 'all', label: t(msg.filterAllStatuses) },
    { value: 'up-to-date', label: t(msg.assetStatusUpToDate) },
    { value: 'outdated', label: t(msg.assetStatusOutdated) },
    { value: 'unavailable', label: t(msg.assetStatusUnavailable) },
  ]

  return (
    <div className={styles['root']}>
      <div className={styles['filters']}>
        <Search
          placeholder={t(msg.searchAssetsPlaceholder)}
          value={searchSignal.value}
          onChange={(v) => {
            searchSignal.value = v
          }}
        />
        <Select
          options={STATUS_OPTIONS}
          value={statusFilterSignal.value}
          onChange={(v) => {
            statusFilterSignal.value = v as typeof statusFilterSignal.value
          }}
          aria-label={t(msg.filterStatus)}
        />
        <Select
          options={[{ value: 'all', label: t(msg.filterAllWorkspaces) }]}
          value="all"
          onChange={() => {}}
          aria-label={t(msg.filterWorkspaces)}
        />
      </div>

      <DataTable<CatalogAsset>
        columns={columns}
        rows={filteredRows.value}
        getRowId={(row) => row.id}
        emptyState={<EmptyState title={t(msg.assetsEmpty)} />}
        density="compact"
        renderExpandedRow={(row) => (
          <div className={styles['subRows']}>
            <div className={styles['subHeader']}>
              <span>{t(msg.subColWorkspace)}</span>
              <span>{t(msg.subColProject)}</span>
              <span>{t(msg.subColVersionInUse)}</span>
              <span>{t(msg.subColLastDeployed)}</span>
            </div>
            {row.workspaceRows.map((wr, i) => (
              <div key={i} className={styles['subRow']}>
                <span>{wr.workspace}</span>
                <span>{wr.project}</span>
                <span className={styles['mono']}>{wr.versionInUse}</span>
                <span>{wr.lastDeployed}</span>
              </div>
            ))}
          </div>
        )}
      />
    </div>
  )
}
