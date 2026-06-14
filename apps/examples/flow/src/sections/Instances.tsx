'use client'
import { signal, useSignalEffect, useSignals } from '@cascivo/core'
import { t } from '@cascivo/i18n'
import { Badge, DataTable } from '@cascivo/react'
import type { Column } from '@cascivo/react'
import { selectedInstanceId } from '../App'
import { api } from '../api'
import type { ProcessInstance, InstanceStatus } from '../api'
import { InstanceDetail } from './InstanceDetail'
import { msg } from '../i18n'
import styles from './Instances.module.css'

type Filter = 'all' | InstanceStatus

const filterSignal = signal<Filter>('all')
const instancesSignal = signal<ProcessInstance[]>([])
const loadingSignal = signal(true)

const STATUS_BADGE: Record<InstanceStatus, 'default' | 'success' | 'warning' | 'destructive'> = {
  active: 'default',
  completed: 'success',
  incident: 'destructive',
}

const FILTERS: Array<{ value: Filter; label: string }> = [
  { value: 'all', label: 'All' },
  { value: 'active', label: 'Active' },
  { value: 'completed', label: 'Completed' },
  { value: 'incident', label: 'Incident' },
]

const COLUMNS: Column<ProcessInstance>[] = [
  {
    key: 'id',
    header: 'ID',
    render: (row) => (
      <span style={{ fontFamily: 'var(--cascivo-font-mono)', fontSize: 'var(--cascivo-text-xs)' }}>
        {row.id}
      </span>
    ),
  },
  {
    key: 'status',
    header: t(msg.colStatus),
    render: (row) => (
      <Badge variant={STATUS_BADGE[row.status]}>
        {row.status.charAt(0).toUpperCase() + row.status.slice(1)}
      </Badge>
    ),
  },
  {
    key: 'startedAt',
    header: t(msg.colStarted),
    render: (row) =>
      new Date(row.startedAt).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      }),
  },
  {
    key: 'currentNodeId',
    header: t(msg.colCurrentNode),
    render: (row) => row.currentNodeId ?? '—',
  },
]

export function Instances() {
  useSignals()

  useSignalEffect(() => {
    const filter = filterSignal.value
    let cancelled = false
    loadingSignal.value = true
    api
      .listInstances(filter === 'all' ? undefined : filter)
      .then((data) => {
        if (cancelled) return
        instancesSignal.value = data
        loadingSignal.value = false
      })
      .catch(() => {
        if (cancelled) return
        loadingSignal.value = false
      })
    return () => {
      cancelled = true
    }
  })

  const selectedId = selectedInstanceId.value

  return (
    <div className={styles['layout']}>
      <div className={styles['list']}>
        <div className={styles['filter']}>
          {FILTERS.map((f) => (
            <button
              key={f.value}
              type="button"
              className={styles['filterBtn']}
              data-active={filterSignal.value === f.value ? 'true' : undefined}
              onClick={() => {
                filterSignal.value = f.value
              }}
            >
              {f.label}
            </button>
          ))}
        </div>

        <DataTable<ProcessInstance>
          columns={COLUMNS}
          rows={instancesSignal.value}
          getRowId={(row) => row.id}
          loading={loadingSignal.value}
          emptyState={<span>{t(msg.emptyInstances)}</span>}
          selection={{
            mode: 'single',
            selected: selectedId ? [selectedId] : [],
            onChange: (ids) => {
              selectedInstanceId.value = ids[0] ?? null
            },
          }}
          density="compact"
        />
      </div>

      <div className={styles['detail']}>
        {selectedId ? (
          <InstanceDetail instanceId={selectedId} />
        ) : (
          <p className={styles['detailPlaceholder']}>Select an instance to view details.</p>
        )}
      </div>
    </div>
  )
}
