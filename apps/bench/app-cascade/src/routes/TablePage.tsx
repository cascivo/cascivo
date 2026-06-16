import { useSignal, useSignals } from '@cascivo/core'
import { Badge, Button, DataTable } from '@cascivo/react'
import { buildRows, updateEveryTenth, type Row } from '../data'

export function TablePage() {
  useSignals()
  const rows = useSignal<Row[]>([])
  const selected = useSignal<string[]>([])

  const columns = [
    { key: 'id', header: 'ID' },
    { key: 'name', header: 'Name' },
    { key: 'price', header: 'Price' },
    {
      key: 'status',
      header: 'Status',
      render: (row: Row) => <Badge>{row.status}</Badge>,
    },
  ]

  return (
    <main>
      <div>
        <Button data-bench="create-1k" onClick={() => (rows.value = buildRows(1000))}>
          Create 1k
        </Button>
        <Button data-bench="create-10k" onClick={() => (rows.value = buildRows(10000))}>
          Create 10k
        </Button>
        <Button
          data-bench="update-every-10th"
          onClick={() => (rows.value = updateEveryTenth(rows.value))}
        >
          Update every 10th
        </Button>
        <Button data-bench="select-row" onClick={() => (selected.value = ['5'])}>
          Select row 5
        </Button>
        <Button data-bench="clear" onClick={() => (rows.value = [])}>
          Clear
        </Button>
      </div>
      <div data-bench-root="table">
        <DataTable
          rows={rows.value}
          columns={columns}
          getRowId={(row: Row) => String(row.id)}
          selection={{
            mode: 'single',
            selected: selected.value,
            onChange: (ids: string[]) => (selected.value = ids),
          }}
        />
      </div>
    </main>
  )
}
