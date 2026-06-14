'use client'
import { signal, useSignalEffect, useSignals } from '@cascivo/core'
import { t } from '@cascivo/i18n'
import { Badge, DataTable } from '@cascivo/react'
import type { Column } from '@cascivo/react'
import { api } from '../api'
import type { Incident } from '../api'
import { msg } from '../i18n'

const incidentsSignal = signal<Incident[]>([])
const loadingSignal = signal(true)

const COLUMNS: Column<Incident>[] = [
  {
    key: 'instanceId',
    header: t(msg.colInstance),
    render: (row) => (
      <span style={{ fontFamily: 'var(--cascivo-font-mono)', fontSize: 'var(--cascivo-text-xs)' }}>
        {row.instanceId}
      </span>
    ),
  },
  {
    key: 'nodeId',
    header: t(msg.colNode),
    render: (row) => row.nodeId,
  },
  {
    key: 'message',
    header: t(msg.colMessage),
    render: (row) => row.message,
  },
  {
    key: 'timestamp',
    header: t(msg.colTimestamp),
    render: (row) =>
      new Date(row.timestamp).toLocaleString(undefined, {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }),
  },
  {
    key: 'status',
    header: t(msg.colStatus),
    render: () => <Badge variant="destructive">{t(msg.statusOpen)}</Badge>,
  },
]

export function Incidents() {
  useSignals()

  useSignalEffect(() => {
    let cancelled = false
    loadingSignal.value = true
    api
      .listIncidents()
      .then((data) => {
        if (cancelled) return
        incidentsSignal.value = data
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

  return (
    <div style={{ padding: 'var(--cascivo-space-6)' }}>
      <DataTable<Incident>
        title={t(msg.titleIncidents)}
        columns={COLUMNS}
        rows={incidentsSignal.value}
        getRowId={(row) => row.id}
        loading={loadingSignal.value}
        emptyState={<span>{t(msg.emptyIncidents)}</span>}
        density="normal"
      />
    </div>
  )
}
