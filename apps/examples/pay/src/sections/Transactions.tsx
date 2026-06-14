'use client'
import { signal, useSignalEffect, useSignals } from '@cascivo/core'
import { formatNumber, t } from '@cascivo/i18n'
import { Alert, Badge, Button, DataTable, EmptyState, Skeleton, useToast } from '@cascivo/react'
import { SegmentedControl } from '@cascivo/react'
import { persistedSignal } from '@cascivo/storage'
import { rangeSignal } from '../App'
import { listTransactions, refundTx } from '../api'
import { msg } from '../i18n'
import type { TxPage } from '../api'
import type { TxStatus } from '../data/fixtures'
import type { Column } from '@cascivo/react'
import styles from './Transactions.module.css'

type FilterStatus = TxStatus | 'all'
type EnrichedTx = TxPage['items'][number]

// Module-level signals
const txPage = signal<TxPage | null>(null)
const loading = signal(true)
const loadError = signal<string | null>(null)
const page = signal(1)
const statusFilter = signal<FilterStatus>('all')
const refundError = signal<string | null>(null)

// Persisted refunds — optimistic state that survives reload
const refundedIds = persistedSignal<string[]>('pay-refunds', [])

// Rows with optimistic refund status applied
function applyOptimisticRefunds(items: EnrichedTx[]): EnrichedTx[] {
  const refunded = new Set(refundedIds.value)
  return items.map((tx) => (refunded.has(tx.id) ? { ...tx, status: 'refunded' as TxStatus } : tx))
}

const STATUS_OPTIONS = [
  { label: t(msg.filterAll), value: 'all' },
  { label: t(msg.filterSucceeded), value: 'succeeded' },
  { label: t(msg.filterPending), value: 'pending' },
  { label: t(msg.filterRefunded), value: 'refunded' },
  { label: t(msg.filterFailed), value: 'failed' },
]

const STATUS_VARIANT: Record<TxStatus, 'success' | 'warning' | 'destructive' | 'secondary'> = {
  succeeded: 'success',
  pending: 'warning',
  refunded: 'secondary',
  failed: 'destructive',
}

function fmtAmount(cents: number) {
  return `$${formatNumber(cents / 100, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: '2-digit',
  })
}

export function Transactions() {
  useSignals()
  const { toast } = useToast()

  useSignalEffect(() => {
    // Track all three dependencies so this re-runs on any change
    const currentRange = rangeSignal.value
    const currentPage = page.value
    const currentStatus = statusFilter.value

    loading.value = true
    loadError.value = null

    listTransactions(currentRange, currentPage, currentStatus)
      .then((result) => {
        txPage.value = result
        loading.value = false
      })
      .catch((err: unknown) => {
        loadError.value = err instanceof Error ? err.message : 'Unknown error'
        loading.value = false
      })
  })

  function handleRefund(tx: EnrichedTx) {
    if (tx.status !== 'succeeded') return

    // 1. Optimistic update
    refundedIds.value = [...refundedIds.value, tx.id]
    refundError.value = null

    // 2. API call
    refundTx(tx.id)
      .then(() => {
        toast({ title: t(msg.refundSuccess), variant: 'success' })
      })
      .catch((err: unknown) => {
        // 3. Rollback on failure
        refundedIds.value = refundedIds.value.filter((id) => id !== tx.id)
        const msg2 = err instanceof Error ? err.message : 'Unknown error'
        refundError.value = msg2
        toast({ title: t(msg.refundError), description: msg2, variant: 'destructive' })
      })
  }

  const columns: Column<EnrichedTx>[] = [
    {
      key: 'status',
      header: t(msg.colStatus),
      render: (row) => {
        const effective = refundedIds.value.includes(row.id) ? 'refunded' : row.status
        return <Badge variant={STATUS_VARIANT[effective]}>{effective}</Badge>
      },
    },
    {
      key: 'customerName',
      header: t(msg.colCustomer),
    },
    {
      key: 'productName',
      header: t(msg.colProduct),
    },
    {
      key: 'amount',
      header: t(msg.colAmount),
      align: 'end',
      render: (row) => fmtAmount(row.amount),
    },
    {
      key: 'timestamp',
      header: t(msg.colDate),
      render: (row) => fmtDate(row.timestamp),
    },
    {
      key: 'actions',
      header: '',
      render: (row) => {
        const effective = refundedIds.value.includes(row.id) ? 'refunded' : row.status
        if (effective !== 'succeeded') return null
        return (
          <Button size="sm" variant="ghost" onClick={() => handleRefund(row)}>
            {t(msg.actionRefund)}
          </Button>
        )
      },
    },
  ]

  const rows = applyOptimisticRefunds(txPage.value?.items ?? [])
  const total = txPage.value?.total ?? 0

  return (
    <div className={styles['root']}>
      <div className={styles['toolbar']}>
        <h2 className={styles['title']}>{t(msg.sectionPayments)}</h2>
        <SegmentedControl
          options={STATUS_OPTIONS}
          value={statusFilter.value}
          onValueChange={(v) => {
            statusFilter.value = v as FilterStatus
            page.value = 1
          }}
          size="sm"
        />
      </div>

      {refundError.value && (
        <Alert
          variant="destructive"
          title={t(msg.refundError)}
          dismissible
          onDismiss={() => {
            refundError.value = null
          }}
        >
          {refundError.value}
        </Alert>
      )}

      {loading.value ? (
        <Skeleton style={{ height: '400px', borderRadius: 'var(--cascivo-radius-surface)' }} />
      ) : (
        <DataTable
          columns={columns}
          rows={rows}
          getRowId={(row) => row.id}
          emptyState={<EmptyState title={t(msg.emptyTransactions)} />}
          pagination={{ pageSize: 10 }}
          stickyHeader
        />
      )}

      {!loading.value && total > 10 && (
        <div className={styles['paginationRow']}>
          <span className={styles['rangeLabel']}>
            {(page.value - 1) * 10 + 1}–{Math.min(page.value * 10, total)} of {total}
          </span>
          <div className={styles['pageButtons']}>
            <Button
              size="sm"
              variant="secondary"
              disabled={page.value <= 1}
              onClick={() => {
                page.value -= 1
              }}
            >
              {t(msg.previous)}
            </Button>
            <Button
              size="sm"
              variant="secondary"
              disabled={page.value * 10 >= total}
              onClick={() => {
                page.value += 1
              }}
            >
              {t(msg.next)}
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
