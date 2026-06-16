'use client'
import { useComputed, useSignal, useSignals } from '@cascivo/core'
import type React from 'react'
import { Badge } from '../../badge/badge'
import { Button } from '../../button/button'
import { Input } from '../../input/input'
import styles from './dashboard-table.module.css'

type Row = {
  id: string
  name: string
  email: string
  status: 'active' | 'inactive' | 'pending'
  date: string
  amount: string
}

const ALL_ROWS: Row[] = [
  {
    id: '1',
    name: 'Alice Johnson',
    email: 'alice@example.com',
    status: 'active',
    date: '2026-06-01',
    amount: '$240.00',
  },
  {
    id: '2',
    name: 'Bob Smith',
    email: 'bob@example.com',
    status: 'pending',
    date: '2026-06-03',
    amount: '$120.50',
  },
  {
    id: '3',
    name: 'Carol White',
    email: 'carol@example.com',
    status: 'active',
    date: '2026-06-05',
    amount: '$895.00',
  },
  {
    id: '4',
    name: 'David Brown',
    email: 'david@example.com',
    status: 'inactive',
    date: '2026-06-07',
    amount: '$60.00',
  },
  {
    id: '5',
    name: 'Eve Davis',
    email: 'eve@example.com',
    status: 'active',
    date: '2026-06-09',
    amount: '$340.00',
  },
  {
    id: '6',
    name: 'Frank Miller',
    email: 'frank@example.com',
    status: 'pending',
    date: '2026-06-11',
    amount: '$180.75',
  },
  {
    id: '7',
    name: 'Grace Wilson',
    email: 'grace@example.com',
    status: 'active',
    date: '2026-06-13',
    amount: '$520.00',
  },
]

const PAGE_SIZE = 5

const STATUS_VARIANT: Record<Row['status'], 'success' | 'warning' | 'outline'> = {
  active: 'success',
  pending: 'warning',
  inactive: 'outline',
}

export function DashboardTable() {
  useSignals()
  const query = useSignal('')
  const page = useSignal(0)
  const sortCol = useSignal<keyof Row>('date')
  const sortAsc = useSignal(true)

  const filtered = useComputed(() => {
    const q = query.value.toLowerCase()
    return ALL_ROWS.filter(
      (r) =>
        !q ||
        r.name.toLowerCase().includes(q) ||
        r.email.toLowerCase().includes(q) ||
        r.status.includes(q),
    )
  })

  const sorted = useComputed(() => {
    const col = sortCol.value
    const asc = sortAsc.value
    return [...filtered.value].sort((a, b) => {
      const cmp = a[col] < b[col] ? -1 : a[col] > b[col] ? 1 : 0
      return asc ? cmp : -cmp
    })
  })

  const pageCount = useComputed(() => Math.ceil(sorted.value.length / PAGE_SIZE))
  const rows = useComputed(() =>
    sorted.value.slice(page.value * PAGE_SIZE, (page.value + 1) * PAGE_SIZE),
  )

  function toggleSort(col: keyof Row) {
    if (sortCol.value === col) {
      sortAsc.value = !sortAsc.value
    } else {
      sortCol.value = col
      sortAsc.value = true
    }
    page.value = 0
  }

  function handleSearch(e: React.ChangeEvent<HTMLInputElement>) {
    query.value = e.target.value
    page.value = 0
  }

  const colLabel = (col: keyof Row, label: string) =>
    `${label}${sortCol.value === col ? (sortAsc.value ? ' ↑' : ' ↓') : ''}`

  return (
    <div className={styles.root}>
      <div className={styles.toolbar}>
        <h1 className={styles.toolbarTitle}>Customers</h1>
        <Input
          type="search"
          placeholder="Search customers…"
          value={query.value}
          onChange={handleSearch}
        />
        <Button variant="ghost" onClick={() => {}}>
          Export
        </Button>
      </div>

      <div className={styles.tableWrapper}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th onClick={() => toggleSort('name')}>{colLabel('name', 'Name')}</th>
              <th onClick={() => toggleSort('status')}>{colLabel('status', 'Status')}</th>
              <th onClick={() => toggleSort('email')}>{colLabel('email', 'Email')}</th>
              <th onClick={() => toggleSort('date')}>{colLabel('date', 'Date')}</th>
              <th onClick={() => toggleSort('amount')}>{colLabel('amount', 'Amount')}</th>
            </tr>
          </thead>
          <tbody>
            {rows.value.map((row) => (
              <tr key={row.id}>
                <td>{row.name}</td>
                <td>
                  <Badge variant={STATUS_VARIANT[row.status]}>{row.status}</Badge>
                </td>
                <td>{row.email}</td>
                <td>{row.date}</td>
                <td>{row.amount}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className={styles.pagination}>
        <span>
          Page {page.value + 1} of {pageCount.value || 1}
        </span>
        <div className={styles.paginationControls}>
          <Button
            variant="ghost"
            size="sm"
            disabled={page.value === 0}
            onClick={() => {
              page.value -= 1
            }}
          >
            Previous
          </Button>
          <Button
            variant="ghost"
            size="sm"
            disabled={page.value >= pageCount.value - 1}
            onClick={() => {
              page.value += 1
            }}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  )
}
