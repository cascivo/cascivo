import { DataTable } from '../../src/data-table/data-table'

export default (
  <DataTable
    zebra
    stickyHeader
    density="compact"
    columns={[{ key: 'c0', header: 'Name' }]}
    rows={[{ c0: 'a' }, { c0: 'b' }, { c0: 'c' }]}
  />
)
