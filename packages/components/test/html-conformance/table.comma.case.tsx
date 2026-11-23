import { DataTable } from '../../src/data-table/data-table'

export default (
  <DataTable
    columns={[
      { key: 'c0', header: 'Name' },
      { key: 'c1', header: 'Note' },
    ]}
    rows={[
      { c0: 'Ann', c1: 'a, b' },
      { c0: 'Bob', c1: 'x | y\\z' },
    ]}
  />
)
