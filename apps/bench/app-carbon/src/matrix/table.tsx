import {
  DataTable,
  Table,
  TableHead,
  TableRow,
  TableHeader,
  TableBody,
  TableCell,
  TableContainer,
} from '@carbon/react'
import { createRoot } from 'react-dom/client'
import '../index.scss'
import { buildRows } from '../data'

const headers = [
  { key: 'id', header: 'ID' },
  { key: 'name', header: 'Name' },
]
const rows = buildRows(5).map((r) => ({ ...r, id: String(r.id) }))
createRoot(document.getElementById('root')!).render(
  <DataTable rows={rows} headers={headers}>
    {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
    {({ rows: rs, headers: hs, getHeaderProps, getRowProps }: any) => (
      <TableContainer>
        <Table>
          <TableHead>
            <TableRow>
              {hs.map((h: any) => (
                <TableHeader {...getHeaderProps({ header: h })} key={h.key}>
                  {h.header}
                </TableHeader>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {rs.map((row: any) => (
              <TableRow {...getRowProps({ row })} key={row.id}>
                {row.cells.map((cell: any) => (
                  <TableCell key={cell.id}>{String(cell.value)}</TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    )}
  </DataTable>,
)
