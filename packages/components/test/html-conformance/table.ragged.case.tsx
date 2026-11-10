import { DataTable } from '../../src/data-table/data-table'

export default (
  <DataTable columns={[{ key: 'c0', header: 'Name' }, { key: 'c1', header: 'Qty' }, { key: 'c2', header: 'Note' }, { key: 'c3', header: '' }]} rows={[{ c0: 'a' }, { c0: 'b', c1: '2', c2: 'x' }, { c0: 'c', c1: '3', c2: 'y', c3: 'z' }]} />
)
