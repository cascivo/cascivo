import { flexRender, getCoreRowModel, useReactTable, type ColumnDef } from '@tanstack/react-table'
import { useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { buildRows, updateEveryTenth, type Row } from '../data'

const columns: ColumnDef<Row>[] = [
  { accessorKey: 'id', header: 'ID' },
  { accessorKey: 'name', header: 'Name' },
  { accessorKey: 'price', header: 'Price' },
  {
    accessorKey: 'status',
    header: 'Status',
    cell: ({ row }) => <Badge variant="outline">{row.original.status}</Badge>,
  },
]

export function TablePage() {
  const [data, setData] = useState<Row[]>([])
  const [rowSelection, setRowSelection] = useState({})

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    onRowSelectionChange: setRowSelection,
    state: { rowSelection },
    getRowId: (row) => String(row.id),
  })

  return (
    <main className="p-4">
      <div className="flex gap-2 pb-4">
        <Button data-bench="create-1k" onClick={() => setData(buildRows(1000))}>
          Create 1k
        </Button>
        <Button data-bench="create-10k" onClick={() => setData(buildRows(10000))}>
          Create 10k
        </Button>
        <Button data-bench="update-every-10th" onClick={() => setData((d) => updateEveryTenth(d))}>
          Update every 10th
        </Button>
        <Button data-bench="select-row" onClick={() => setRowSelection({ '5': true })}>
          Select row 5
        </Button>
        <Button data-bench="clear" onClick={() => setData([])}>
          Clear
        </Button>
      </div>
      <div data-bench-root="table">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((hg) => (
              <TableRow key={hg.id}>
                {hg.headers.map((h) => (
                  <TableHead key={h.id}>
                    {flexRender(h.column.columnDef.header, h.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.map((row) => (
              <TableRow key={row.id} data-state={row.getIsSelected() ? 'selected' : undefined}>
                {row.getVisibleCells().map((cell) => (
                  <TableCell key={cell.id}>
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </main>
  )
}
