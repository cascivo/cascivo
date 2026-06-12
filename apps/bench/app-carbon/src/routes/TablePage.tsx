import {
  Button,
  DataTable,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableHeader,
  TableRow,
  TableSelectRow,
  Tag,
} from '@carbon/react'
import { useState } from 'react'
import { buildRows, updateEveryTenth, type Row } from '../data'

const headers = [
  { key: 'id', header: 'ID' },
  { key: 'name', header: 'Name' },
  { key: 'price', header: 'Price' },
  { key: 'status', header: 'Status' },
]

export function TablePage() {
  const [rows, setRows] = useState<Row[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const tableRows = rows.map((r) => ({ ...r, id: String(r.id) }))

  return (
    <main>
      <div>
        <Button data-bench="create-1k" onClick={() => setRows(buildRows(1000))}>
          Create 1k
        </Button>
        <Button data-bench="create-10k" onClick={() => setRows(buildRows(10000))}>
          Create 10k
        </Button>
        <Button
          data-bench="update-every-10th"
          onClick={() => setRows((r: Row[]) => updateEveryTenth(r))}
        >
          Update every 10th
        </Button>
        <Button data-bench="select-row" onClick={() => setSelectedId('5')}>
          Select row 5
        </Button>
        <Button data-bench="clear" onClick={() => setRows([])}>
          Clear
        </Button>
      </div>
      <div data-bench-root="table">
        <DataTable rows={tableRows} headers={headers}>
          {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
          {({ rows: dtRows, headers: dtHeaders, getHeaderProps, getRowProps }: any) => (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableHeader />
                    {dtHeaders.map((header: any) => (
                      <TableHeader {...getHeaderProps({ header })} key={header.key}>
                        {header.header}
                      </TableHeader>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {dtRows.map((row: any) => (
                    <TableRow {...getRowProps({ row })} key={row.id}>
                      <TableSelectRow
                        id={`select-${row.id}`}
                        name={`select-${row.id}`}
                        checked={selectedId === row.id}
                        onSelect={() => setSelectedId(row.id)}
                      />
                      {row.cells.map((cell: any) => (
                        <TableCell key={cell.id}>
                          {cell.info.header === 'status' ? (
                            <Tag>{String(cell.value)}</Tag>
                          ) : (
                            String(cell.value)
                          )}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </DataTable>
      </div>
    </main>
  )
}
