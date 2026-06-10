import { DataTable, type Column } from '@cascade-ui/components/data-table'

interface Row {
  id: string
  name: string
  email: string
  score: number
}

const rows: Row[] = Array.from({ length: 10_000 }, (_, i) => ({
  id: `r${i}`,
  name: `User ${String(i).padStart(5, '0')}`,
  email: `user${i}@example.com`,
  score: (i * 2654435761) % 1000,
}))

const columns: Column<Row>[] = [
  { key: 'name', header: 'Name', sortable: true },
  { key: 'email', header: 'Email' },
  { key: 'score', header: 'Score', sortable: true, align: 'end' },
]

export function PerfDataTable() {
  return (
    <main data-perf-ready style={{ padding: '1rem' }}>
      <DataTable columns={columns} rows={rows} getRowId={(r) => r.id} searchable />
    </main>
  )
}
