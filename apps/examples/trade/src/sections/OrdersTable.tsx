'use client'
import { useSignals } from '@cascivo/core'
import { t } from '@cascivo/i18n'
import { Badge, Card, DataTable } from '@cascivo/react'
import type { Column } from '@cascivo/react'
import { msg } from '../i18n'
import { day } from '../format'
import { getInstrument } from '../data/instruments'
import type { Order } from '../data/seed'
import { orders } from '../store/portfolio'
import styles from './OrdersTable.module.css'

const STATUS_VARIANT: Record<Order['status'], 'success' | 'secondary' | 'destructive'> = {
  executed: 'success',
  open: 'secondary',
  cancelled: 'destructive',
}

const cap = (s: string): string => s.charAt(0).toUpperCase() + s.slice(1)

export function OrdersTable() {
  useSignals()

  const columns: Column<Order>[] = [
    {
      key: 'instrument',
      header: t(msg.colInstrument),
      width: '14rem',
      render: (o) => {
        const name = getInstrument(o.instrumentId).name
        return (
          <span className={styles['instrument']} title={name}>
            {name}
          </span>
        )
      },
    },
    {
      key: 'status',
      header: t(msg.colStatus),
      render: (o) => (
        <Badge variant={STATUS_VARIANT[o.status]} size="sm">
          {t(
            o.status === 'executed'
              ? msg.statusExecuted
              : o.status === 'open'
                ? msg.statusOpen
                : msg.statusCancelled,
          )}
        </Badge>
      ),
    },
    { key: 'side', header: t(msg.colSide), render: (o) => cap(o.side) },
    { key: 'type', header: t(msg.colType), render: (o) => cap(o.type) },
    { key: 'venue', header: t(msg.colVenue) },
    {
      key: 'placed',
      header: t(msg.colPlaced),
      sortable: true,
      align: 'end',
      render: (o) => day(o.placed),
    },
  ]

  return (
    <Card padding="md" className={styles['panel']}>
      <div className={styles['head']}>
        <h2 className={styles['title']}>{t(msg.ordersTitle)}</h2>
        <span className={styles['tag']}>{t(msg.brokerage)}</span>
      </div>
      <DataTable
        columns={columns}
        rows={[...orders.value]}
        getRowId={(o) => o.id}
        density="compact"
        stickyHeader
        defaultSort={{ key: 'placed', direction: 'desc' }}
        pagination={{ pageSize: 10 }}
      />
    </Card>
  )
}
